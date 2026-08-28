import ExcelJS from "exceljs";

export type Cell = string | number | null | undefined;

/** Build a single-sheet .xlsx workbook from headers + rows and return its bytes. */
export async function toXlsx(
  headers: string[],
  rows: Cell[][],
  sheetName = "Report",
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName.slice(0, 31) || "Report");

  const header = ws.addRow(headers);
  header.font = { bold: true };
  header.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F1F1" },
    };
  });

  for (const r of rows) ws.addRow(r.map((v) => v ?? ""));

  // Roughly auto-size each column to its widest value.
  ws.columns.forEach((col, i) => {
    let max = headers[i]?.length ?? 10;
    for (const r of rows) {
      const v = r[i];
      const len = v == null ? 0 : String(v).length;
      if (len > max) max = len;
    }
    col.width = Math.min(60, Math.max(10, max + 2));
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
