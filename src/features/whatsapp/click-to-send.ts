import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

/**
 * Free "click-to-send" WhatsApp support. Instead of the paid Cloud API, we build
 * official wa.me click-to-chat links that open WhatsApp (web/app) with the message
 * pre-filled to the member — the admin taps Send. No API, no fees, no ban risk.
 */

/** Normalise a stored mobile into a wa.me phone (digits only, +91 default for India). */
export function normalizeWaNumber(raw?: string | null): string | null {
  if (!raw) return null;
  const first = raw.split(/[/,;]/)[0] ?? "";
  let d = first.replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return null;
  if (d.length === 10) d = "91" + d; // bare Indian mobile
  if (d.length < 11 || d.length > 15) return null;
  return d;
}

/** Build a wa.me click-to-chat URL with a pre-filled message. */
export function waLink(number: string, text: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Fill {{placeholders}} from vars; strip any that are left unfilled. */
export function fillTemplate(body: string, vars: Record<string, string>): string {
  let out = body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out.replace(/\{\{[^}]*\}\}/g, "").replace(/[ \t]{2,}/g, " ").trim();
}

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
        select: { name: true, contactNumber: true },
      }),
      db.whatsAppTemplate.findMany({
        where: { type: { in: ["reminder", "thankyou"] }, isActive: true },
      }),
    ]);
    const body = (t: string) => templates.find((x) => x.type === t)?.body ?? "";
    return {
      orgName: org?.name ?? "",
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
