/**
 * Pure wa.me click-to-send helpers — no server imports, safe to use from
 * client components (the muster grid) and server components alike.
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
  return (
    out
      .replace(/\{\{[^}]*\}\}/g, "")
      // Templates often write "₹{{amount}}" while amounts arrive pre-formatted
      // with their own ₹ — collapse the accidental double symbol.
      .replace(/₹\s*₹/g, "₹")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
}
