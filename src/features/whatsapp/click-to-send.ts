import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

/**
 * Free "click-to-send" WhatsApp support. Instead of the paid Cloud API, we build
 * official wa.me click-to-chat links that open WhatsApp (web/app) with the message
 * pre-filled to the member — the admin taps Send. No API, no fees, no ban risk.
 *
 * The pure link/template helpers live in ./wa-utils (client-safe) and are
 * re-exported here for existing server-side importers.
 */
export { normalizeWaNumber, waLink, fillTemplate } from "./wa-utils";

export type WaClickContext = {
  orgName: string;
  contactNumber: string;
  reminderBody: string;
  thankyouBody: string;
};

/** Org name + reminder/thank-you template bodies, for building click-to-send links. */
export async function getWaClickContext(): Promise<WaClickContext> {
  return withAction({ permission: "whatsapp.send" }, async (ctx) => {
    const [org, templates] = await Promise.all([
      rawDb.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true, nameMr: true, contactNumber: true },
      }),
      db.whatsAppTemplate.findMany({
        where: { type: { in: ["reminder", "thankyou"] }, isActive: true },
      }),
    ]);
    const body = (t: string) => templates.find((x) => x.type === t)?.body ?? "";
    return {
      // Messages are Marathi-first, so prefer the Marathi organization name.
      orgName: org?.nameMr?.trim() || org?.name || "",
      contactNumber: org?.contactNumber ?? "",
      reminderBody:
        body("reminder") ||
        "नमस्कार {{memberName}}, आपली सभासद वर्गणी ₹{{totalPending}} बाकी आहे. कृपया लवकर जमा करावी. धन्यवाद. {{organizationName}}",
      thankyouBody:
        body("thankyou") ||
        "नमस्कार {{memberName}}, आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद. 🙏 {{organizationName}}",
    };
  });
}
