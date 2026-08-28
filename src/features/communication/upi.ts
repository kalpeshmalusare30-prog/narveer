import QRCode from "qrcode";

export function buildUpiUri(input: {
  payeeVpa: string;
  payeeName?: string | null;
  amount?: string | null;
  note?: string | null;
}): string {
  const parts = [
    `pa=${encodeURIComponent(input.payeeVpa)}`,
    `pn=${encodeURIComponent(input.payeeName || "")}`,
  ];
  if (input.amount) parts.push(`am=${encodeURIComponent(input.amount)}`);
  parts.push(`cu=${encodeURIComponent("INR")}`);
  if (input.note) parts.push(`tn=${encodeURIComponent(input.note)}`);
  return `upi://pay?${parts.join("&")}`;
}

export async function upiQrSvg(uri: string): Promise<string> {
  return QRCode.toString(uri, { type: "svg", margin: 1, width: 220 });
}
