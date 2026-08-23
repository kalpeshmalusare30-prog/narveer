export function toCsv(
  headers: string[],
  rows: (string | number)[][],
): string {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows]
    .map((r) => r.map(esc).join(","))
    .join("\r\n");
}
