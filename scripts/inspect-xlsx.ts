import ExcelJS from "exceljs";

const PATH =
  process.argv[2] ?? "C:/Users/Kalpesh/Downloads/सभासद वर्गणी.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(PATH);
  // eslint-disable-next-line no-console
  console.log(
    "Sheets:",
    wb.worksheets.map((w) => `${w.name} (${w.rowCount}r x ${w.columnCount}c)`),
  );
  for (const ws of wb.worksheets) {
    // eslint-disable-next-line no-console
    console.log(`\n===== SHEET: ${ws.name} =====`);
    let printed = 0;
    ws.eachRow((row, n) => {
      if (printed > 25) return;
      const cells = (row.values as unknown[]).slice(1).map((v) => {
        if (v == null) return "";
        if (typeof v === "object") {
          const o = v as { text?: string; result?: unknown };
          return String(o.text ?? o.result ?? "");
        }
        return String(v);
      });
      // eslint-disable-next-line no-console
      console.log(n, "|", cells.join(" | "));
      printed++;
    });
  }
}
main();
