"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";

const configInput = z.object({
  provider: z.string().optional().nullable(),
  phoneId: z.string().optional().nullable(),
  token: z.string().optional().nullable(),
  enabled: z.boolean(),
});

export async function saveWhatsAppConfig(input: z.infer<typeof configInput>) {
  const data = configInput.parse(input);
  return withAction({ permission: "settings.whatsapp.manage" }, async (ctx) => {
    const configured = !!(data.enabled && data.phoneId && data.token);
    await rawDb.organization.update({
      where: { id: ctx.organizationId },
      data: {
        whatsappProvider: data.provider || "meta",
        whatsappPhoneId: data.phoneId || null,
        whatsappToken: data.token || null,
        whatsappConfigured: configured,
      },
    });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "Organization",
      recordId: ctx.organizationId,
      newValue: { whatsappConfigured: configured },
    });
    return { configured };
  });
}

export async function updateTemplateBody(id: string, body: string) {
  return withAction({ permission: "settings.whatsapp.manage" }, async () => {
    const tpl = await db.whatsAppTemplate.findFirst({ where: { id } });
    if (!tpl) throw new Error("NOT_FOUND");
    await db.whatsAppTemplate.update({ where: { id }, data: { body } });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "WhatsAppTemplate",
      recordId: id,
    });
  });
}

// --- form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function saveWhatsAppConfigForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await saveWhatsAppConfig({
      provider: (formData.get("provider") ?? "meta").toString(),
      phoneId: (formData.get("phoneId") ?? "").toString() || null,
      token: (formData.get("token") ?? "").toString() || null,
      enabled: formData.get("enabled") === "on",
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function updateTemplateAction(id: string, body: string) {
  await updateTemplateBody(id, body);
}
