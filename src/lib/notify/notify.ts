import { db } from "@/lib/db/prisma";
import { getTenant } from "@/lib/db/tenant-context";

/** Record an in-app notification for the current tenant (best-effort). */
export async function notify(type: string, message: string): Promise<void> {
  const ctx = getTenant();
  if (!ctx) return;
  try {
    await db.notification.create({
      data: { organizationId: ctx.organizationId, type, message },
    });
  } catch {
    // notifications are non-critical; never break the primary action
  }
}
