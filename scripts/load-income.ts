import { config } from "dotenv";
config();

import ExcelJS from "exceljs";
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FILE = "C:/Users/Kalpesh/Downloads/सभासद वर्गणी.xlsx";

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown };
    return String(o.text ?? o.result ?? "").trim();
  }
  return String(v).trim();
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
function num(s: string): number | null {
  const t = s.replace(/[,\s]/g, "");
  if (t === "" || t === "-" || /[^\d.]/.test(t)) return null;
  const n = Number(t);
  return isNaN(n) || n <= 0 ? null : n;
}

// income lines that are NOT real money-in for balance purposes
const isMembership = (s: string) => /सभासद वर्गणी/.test(s);
const isBankTransfer = (s: string) => /बँक मधुन काढलेले|एकुण/.test(s);
const isCarryForward = (s: string) => /मागिल बाकी/.test(s);

function incomeCategory(item: string): string {
  if (/पावती बुक/.test(item)) return "पावती बुक जमा";
  if (/अन्रदान|दानपेठी|देणगी|दानपेटी/.test(item)) return "देणगी / अन्रदान";
  if (/हरिपाठ|प्रवचन|किर्तन|पूज|पुज/.test(item)) return "धार्मिक कार्यक्रम";
  if (/मागिल बाकी|शिल्लक/.test(item)) return "मागिल शिल्लक";
  return "इतर उत्पन्न";
}

type YearSheet = { year: number; sheet: string; date: Date };
const YEAR_SHEETS: YearSheet[] = [
  { year: 2024, sheet: "वार्षिक अहवाल-2024 ", date: new Date(Date.UTC(2024, 1, 15)) },
  { year: 2025, sheet: "वार्षिक अहवाल-2025", date: new Date(Date.UTC(2025, 1, 15)) },
  { year: 2026, sheet: "वार्षिक अहवाल-2026", date: new Date(Date.UTC(2026, 1, 15)) },
];

async function readIncome() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const out: { year: number; item: string; amount: number; date: Date }[] = [];
  // opening balance = earliest year's मागिल बाकी only (later years are prior-year closings)
  const earliest = Math.min(...YEAR_SHEETS.map((y) => y.year));
  for (const ys of YEAR_SHEETS) {
    const ws = wb.getWorksheet(ys.sheet);
    if (!ws) throw new Error(`sheet not found: ${ys.sheet}`);
    const rows: { item: string; amt: number | null }[] = [];
    ws.eachRow((row, n) => {
      if (n < 3) return;
      const a = (row.values as unknown[]).slice(1);
      rows.push({ item: norm(cellStr(a[0])), amt: num(cellStr(a[1])) });
    });
    const stop = rows.findIndex((r) => /एकुण\s*जमा/.test(r.item));
    const slice = stop >= 0 ? rows.slice(0, stop) : rows;
    for (const r of slice) {
      if (!r.item || r.item === "-" || r.amt == null) continue;
      if (isMembership(r.item)) continue; // already loaded via सभासद वर्गणी sheet
      if (isBankTransfer(r.item)) continue; // transfer, not income
      if (isCarryForward(r.item) && ys.year !== earliest) continue; // avoid double-count
      out.push({ year: ys.year, item: r.item, amount: r.amt, date: ys.date });
    }
  }
  return out;
}

async function main() {
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("NTMP org not found");
  const oid = org.id;

  const income = await readIncome();
  const byYear = new Map<number, number>();
  for (const e of income) byYear.set(e.year, (byYear.get(e.year) ?? 0) + e.amount);
  const grand = income.reduce((s, e) => s + e.amount, 0);
  console.log(`\n===== INCOME IMPORT (${APPLY ? "APPLY" : "DRY-RUN"}) =====`);
  for (const [y, tot] of [...byYear.entries()].sort((a, b) => b[0] - a[0]))
    console.log(`  ${y}: ${income.filter((e) => e.year === y).length} lines, ₹${tot.toLocaleString("en-IN")}`);
  console.log(`  GRAND non-membership income: ₹${grand.toLocaleString("en-IN")} (${income.length} lines)`);

  const existing = await db.income.count({ where: { organizationId: oid } });
  console.log(`  existing income rows to clear: ${existing}`);

  if (!APPLY) {
    console.log("\n(dry-run; re-run with --apply)");
    return;
  }

  await db.income.deleteMany({ where: { organizationId: oid } });
  const cashMode = await db.paymentMode.upsert({
    where: { organizationId_name: { organizationId: oid, name: "Cash" } },
    update: {},
    create: { organizationId: oid, name: "Cash" },
  });
  const catId = new Map<string, string>();
  const ensureCat = async (name: string) => {
    if (catId.has(name)) return catId.get(name)!;
    const c = await db.incomeCategory.upsert({
      where: { organizationId_name: { organizationId: oid, name } },
      update: {},
      create: { organizationId: oid, name },
    });
    catId.set(name, c.id);
    return c.id;
  };

  let created = 0;
  for (const e of income) {
    await db.income.create({
      data: {
        organizationId: oid,
        amount: new Prisma.Decimal(e.amount),
        incomeCategoryId: await ensureCat(incomeCategory(e.item)),
        receivedFrom: e.item,
        paymentModeId: cashMode.id,
        incomeDate: e.date,
      },
    });
    created++;
  }
  console.log(`  created ${created} income rows`);

  const [pay, inc, exp] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
    db.income.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
  ]);
  const membership = Number(pay._sum.amount ?? 0);
  const other = Number(inc._sum.amount ?? 0);
  const expense = Number(exp._sum.amount ?? 0);
  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
  console.log(`\n  membership: ${inr(membership)} | other income: ${inr(other)} | expenses: ${inr(expense)}`);
  console.log(`  TOTAL INCOME: ${inr(membership + other)}  BALANCE: ${inr(membership + other - expense)}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
