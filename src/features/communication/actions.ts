"use server";

import { z } from "zod";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const configSchema = z.object({
  upiId: z.string().optional().nullable(),
  upiPayeeName: z.string().optional().nullable(),
  paymentGatewayProvider: z.string().optional().nullable(),
  paymentGatewayKeyId: z.string().optional().nullable(),
  smsProvider: z.string().optional().nullable(),
  smsSenderId: z.string().optional().nullable(),
  emailProvider: z.string().optional().nullable(),
  emailFromAddress: z.string().optional().nullable(),
});
export type CommunicationConfigInput = z.infer<typeof configSchema>;

export async function saveCommunicationConfigRecord(
  input: CommunicationConfigInput,
) {
  const data = configSchema.parse(input);
  return withAction({ permission: "communication.manage" }, async (ctx) => {
    const paymentGatewayConfigured = !!(
      data.paymentGatewayProvider && data.paymentGatewayKeyId
    );
    const smsConfigured = !!(data.smsProvider && data.smsSenderId);
    const emailConfigured = !!(data.emailProvider && data.emailFromAddress);
    await rawDb.organization.update({
      where: { id: ctx.organizationId },
      data: {
        upiId: data.upiId || null,
        upiPayeeName: data.upiPayeeName || null,
        paymentGatewayProvider: data.paymentGatewayProvider || null,
        paymentGatewayKeyId: data.paymentGatewayKeyId || null,
        paymentGatewayConfigured,
        smsProvider: data.smsProvider || null,
        smsSenderId: data.smsSenderId || null,
        smsConfigured,
        emailProvider: data.emailProvider || null,
        emailFromAddress: data.emailFromAddress || null,
        emailConfigured,
      },
    });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "Organization",
      recordId: ctx.organizationId,
      newValue: {
        upiId: data.upiId || null,
        paymentGatewayConfigured,
        smsConfigured,
        emailConfigured,
      },
    });
    revalidatePath("/settings/communication");
    revalidatePath("/payments/new");
    return { paymentGatewayConfigured, smsConfigured, emailConfigured };
  });
}

// --- Form adapter (called from client form via useActionState) ---

export type SaveState = { error?: string; success?: boolean };

function opt(fd: FormData, key: string): string | null {
  const v = (fd.get(key) ?? "").toString().trim();
  return v === "" ? null : v;
}

export async function saveCommunicationConfig(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireUser();
  try {
    await saveCommunicationConfigRecord({
      upiId: opt(formData, "upiId"),
      upiPayeeName: opt(formData, "upiPayeeName"),
      paymentGatewayProvider: opt(formData, "paymentGatewayProvider"),
      paymentGatewayKeyId: opt(formData, "paymentGatewayKeyId"),
      smsProvider: opt(formData, "smsProvider"),
      smsSenderId: opt(formData, "smsSenderId"),
      emailProvider: opt(formData, "emailProvider"),
      emailFromAddress: opt(formData, "emailFromAddress"),
    });
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
