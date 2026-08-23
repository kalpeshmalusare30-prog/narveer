import Papa from "papaparse";
import ExcelJS from "exceljs";

export function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export type Row = Record<string, string>;

/** Parse a CSV or XLSX buffer into row objects keyed by normalized headers. */
export async function parseSpreadsheet(
  buffer: Buffer,
  filename: string,
): Promise<Row[]> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const wb = new ExcelJS.Workbook();
    // Node Buffer is a Uint8Array at runtime; cast to satisfy exceljs types.
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const rows: Row[] = [];
    let headers: string[] = [];
    ws.eachRow((row, rowNumber) => {
      // exceljs row.values is 1-indexed with a leading null
      const raw = (row.values as unknown[]).slice(1);
      const cells = raw.map((v) => {
        if (v == null) return "";
        if (typeof v === "object") {
          const o = v as { text?: string; result?: unknown };
          return String(o.text ?? o.result ?? "").trim();
        }
        return String(v).trim();
      });
      if (rowNumber === 1) {
        headers = cells.map(normalizeHeader);
        return;
      }
      const obj: Row = {};
      headers.forEach((h, i) => (obj[h] = cells[i] ?? ""));
      if (Object.values(obj).some((v) => v !== "")) rows.push(obj);
    });
    return rows;
  }

  // CSV / plain text
  const text = buffer.toString("utf8").replace(/^﻿/, "");
  const parsed = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });
  return (parsed.data as Row[]).map((r) => {
    const o: Row = {};
    for (const k in r) o[k] = (r[k] ?? "").toString().trim();
    return o;
  });
}

/** First non-empty value among the given normalized header aliases. */
export function pick(row: Row, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return v;
  }
  return "";
}
