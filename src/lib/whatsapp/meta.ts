import type { WhatsAppProvider, SendResult } from "./provider";

/**
 * Meta WhatsApp Cloud API provider. Real integration against the Graph API.
 * Only instantiated when the organization has valid credentials configured.
 */
export class MetaCloudProvider implements WhatsAppProvider {
  readonly configured = true;
  constructor(
    private phoneNumberId: string,
    private token: string,
  ) {}

  async send(to: string, body: string): Promise<SendResult> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: false, body },
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
      }
      const data = (await res.json()) as {
        messages?: { id?: string }[];
      };
      return { ok: true, providerMessageId: data.messages?.[0]?.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
