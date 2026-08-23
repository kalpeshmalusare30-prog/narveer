import type { WhatsAppProvider } from "./provider";
import { MetaCloudProvider } from "./meta";

export { renderTemplate } from "./provider";
export type { WhatsAppProvider, SendResult } from "./provider";

export type OrgWhatsAppConfig = {
  whatsappConfigured: boolean;
  whatsappProvider: string | null;
  whatsappPhoneId: string | null;
  whatsappToken: string | null;
};

/** Returns a configured provider, or null when WhatsApp is not set up. */
export function getProvider(org: OrgWhatsAppConfig): WhatsAppProvider | null {
  if (!org.whatsappConfigured || !org.whatsappPhoneId || !org.whatsappToken) {
    return null;
  }
  // Only the Meta Cloud API is implemented; extend here for other BSPs.
  return new MetaCloudProvider(org.whatsappPhoneId, org.whatsappToken);
}
