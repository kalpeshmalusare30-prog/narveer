import { rawDb } from "@/lib/db/raw";

const STATUS_MAP: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};

// Progression rank so a later callback never downgrades status (e.g. a
// "delivered" arriving after "read" is ignored). Failed always applies.
const RANK: Record<string, number> = {
  Pending: 0,
  Sent: 1,
  Delivered: 2,
  Read: 3,
  Failed: 1,
};

type MetaPayload = {
  entry?: {
    changes?: {
      value?: {
        statuses?: {
          id?: string;
          status?: string;
          errors?: { title?: string; message?: string }[];
        }[];
      };
    }[];
  }[];
};

/**
 * Apply Meta WhatsApp Cloud API status callbacks to stored messages, matched by
 * provider message id (wamid). Tenant-safe: wamid is globally unique. Returns
 * how many messages were updated.
 */
export async function processStatusUpdate(
  payload: MetaPayload,
): Promise<{ updated: number }> {
  let updated = 0;
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const s of change?.value?.statuses ?? []) {
        const wamid = s?.id;
        const status = s?.status ? STATUS_MAP[s.status] : undefined;
        if (!wamid || !status) continue;
        const msg = await rawDb.whatsAppMessage.findFirst({
          where: { providerMessageId: wamid },
        });
        if (!msg) continue;
        const isForward = (RANK[status] ?? 0) >= (RANK[msg.status] ?? 0);
        if (status !== "Failed" && !isForward) continue;
        await rawDb.whatsAppMessage.update({
          where: { id: msg.id },
          data: {
            status,
            failureReason:
              status === "Failed"
                ? (s.errors?.[0]?.title ??
                  s.errors?.[0]?.message ??
                  "failed")
                : null,
          },
        });
        updated++;
      }
    }
  }
  return { updated };
}
