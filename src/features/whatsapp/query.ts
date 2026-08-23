import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

export async function listMessages() {
  return withAction({ permission: "whatsapp.view" }, async () =>
    db.whatsAppMessage.findMany({
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
}

export async function getWhatsAppStatus() {
  return withAction({ permission: "whatsapp.view" }, async (ctx) => {
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { whatsappConfigured: true, whatsappPhoneId: true },
    });
    return {
      configured: !!(org?.whatsappConfigured && org?.whatsappPhoneId),
    };
  });
}

export async function listTemplates() {
  return withAction({ permission: "settings.whatsapp.manage" }, async () =>
    db.whatsAppTemplate.findMany({ orderBy: { type: "asc" } }),
  );
}

export async function getWhatsAppConfig() {
  return withAction({ permission: "settings.whatsapp.manage" }, async (ctx) =>
    rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        whatsappConfigured: true,
        whatsappProvider: true,
        whatsappPhoneId: true,
        whatsappToken: true,
      },
    }),
  );
}
