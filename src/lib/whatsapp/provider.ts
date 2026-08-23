export type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export interface WhatsAppProvider {
  readonly configured: boolean;
  send(to: string, body: string): Promise<SendResult>;
}

/** Replace {{variable}} tokens in a template body. Unknown tokens become "". */
export function renderTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}
