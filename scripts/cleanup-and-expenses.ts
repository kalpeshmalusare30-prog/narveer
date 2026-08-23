import { config } from "dotenv";
config();

import ExcelJS from "exceljs";
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FILE = "C:/Users/Kalpesh/Downloads/सभासद वर्गणी.xlsx";

// duplicate (to remove) => canonical (to keep). Only matra spelling differs.
const DUP_TO_CANON: Record<string, string> = {
  "पांडुरंग मनू मालुसरे": "पांडुरंग मनु मालुसरे",
  "ज्ञानेश्वर तुळशीराम मालुसरे": "ज्ञानेश्वर तुळशिराम मालुसरे",
};
// non-roster receipt-book entries to remove entirely
const REMOVE_NAMES = ["चंद्रकांत राजू दुधाने", "महादेव पवार"];

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

// ---- expense category mapping (keyword -> category name in Marathi) ----
function expenseCategory(item: string): string {
  const s = item;
  if (/भटजी|प्रवचन|किर्तन|शिवव्याख्यान|हरिपाठ|जागरण|पुज|पूज|चादर/.test(s))
    return "धार्मिक कार्यक्रम";
  if (/साउंड|साऊंड|बॅनर|झेंडे|फुले|हार|शाल|उपरणे|सन्मानचिन्ह|तलवार/.test(s))
    return "साऊंड व सजावट";
  if (/गुलाबजाम|मसाले|पत्रावली|ग्लास|जेवन|नाष्टा|पनीर|तूप|चहापानी|प्रसाद|अन्न|फटाके/.test(s))
    return "अन्न व प्रसाद";
  if (/बाजार/.test(s)) return "बाजार खरेदी";
  if (/पाणी|गाडी भाडे|भाडे|वाहतूक/.test(s)) return "वाहतूक व पाणी";
  if (/घुमट|स्लोपिंग|वेल्डिंग|लाईट|रिपेर|कलर|गॅस|मंदीर|मंदिर|देखभाल|दुरुस्त/.test(s))
    return "देखभाल व दुरुस्ती";
  if (/पावती बुक|हँडवेल|पॅन कार्ड|रजिस्टर|कार्यालय/.test(s)) return "कार्यालयीन";
  return "इतर खर्च";
}
// balance/transfer lines that are NOT operational expenses
function isNonOperational(item: string): boolean {
  return /खजिनदारकडे बाकी|बँकेत भरले|ऑनलाइन बँक मधे|बँक मधुन काढलेले|फंडासाठी दिले|एकुण/.test(
    item,
  );
}

type YearSheet = { year: number; sheet: string; date: Date };
const YEAR_SHEETS: YearSheet[] = [
  { year: 2026, sheet: "वार्षिक अहवाल-2026", date: new Date(Date.UTC(2026, 1, 15)) },
  { year: 2025, sheet: "वार्षिक अहवाल-2025", date: new Date(Date.UTC(2025, 1, 15)) },
  { year: 2024, sheet: "वार्षिक अहवाल-2024 ", date: new Date(Date.UTC(2024, 1, 15)) },
];

async function readExpenses() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);
  const out: { year: number; item: string; amount: number; date: Date }[] = [];
  for (const ys of YEAR_SHEETS) {
    const ws = wb.getWorksheet(ys.sheet);
    if (!ws) throw new Error(`sheet not found: ${ys.sheet}`);
    // collect the expense column (idx 3 = name, idx 4 = amount) in row order
    const rows: { item: string; amt: number | null }[] = [];
    ws.eachRow((row, n) => {
      if (n < 3) return;
      const a = (row.values as unknown[]).slice(1);
      rows.push({ item: norm(cellStr(a[3])), amt: num(cellStr(a[4])) });
    });
    // the operational expenses run until the first "एकुण खर्च" total line
    const stop = rows.findIndex((r) => /एकुण\s*खर्च/.test(r.item));
    const slice = stop >= 0 ? rows.slice(0, stop) : rows;
    for (const r of slice) {
      if (!r.item || r.item === "-" || r.amt == null) continue;
      if (isNonOperational(r.item)) continue;
      out.push({ year: ys.year, item: r.item, amount: r.amt, date: ys.date });
    }
  }
  return out;
}

async function main() {
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("NTMP org not found");
  const oid = org.id;

  const findMember = async (fullName: string) =>
    db.member.findFirst({ where: { organizationId: oid, fullName } });

  console.log(`\n===== MEMBER CLEANUP (${APPLY ? "APPLY" : "DRY-RUN"}) =====`);

  // 1) merge duplicates into canonical members
  for (const [dupName, canonName] of Object.entries(DUP_TO_CANON)) {
    const dup = await findMember(dupName);
    const canon = await findMember(canonName);
    if (!dup) {
      console.log(`  [skip] duplicate not found: "${dupName}"`);
      continue;
    }
    if (!canon) {
      console.log(`  [WARN] canonical not found: "${canonName}" (leaving dup in place)`);
      continue;
    }
    const [fees, payments, receipts] = await Promise.all([
      db.annualFee.findMany({ where: { memberId: dup.id } }),
      db.payment.findMany({ where: { memberId: dup.id } }),
      db.receipt.findMany({ where: { memberId: dup.id } }),
    ]);
    console.log(
      `  MERGE "${dupName}"(${dup.memberCode}) -> "${canonName}"(${canon.memberCode}): ` +
        `${fees.length} fees, ${payments.length} payments, ${receipts.length} receipts`,
    );
    if (!APPLY) continue;

    // reassign fees, resolving FY uniqueness conflicts
    for (const f of fees) {
      const clash = await db.annualFee.findFirst({
        where: {
          organizationId: oid,
          memberId: canon.id,
          financialYearId: f.financialYearId,
        },
      });
      if (clash) {
        // move allocations onto canon's fee, then delete dup fee
        await db.paymentAllocation.updateMany({
          where: { annualFeeId: f.id },
          data: { annualFeeId: clash.id },
        });
        await db.annualFee.delete({ where: { id: f.id } });
      } else {
        await db.annualFee.update({
          where: { id: f.id },
          data: { memberId: canon.id },
        });
      }
    }
    const movedPaymentIds = payments.map((p) => p.id);
    await db.payment.updateMany({
      where: { memberId: dup.id },
      data: { memberId: canon.id },
    });
    await db.receipt.updateMany({
      where: { memberId: dup.id },
      data: { memberId: canon.id },
    });
    // re-allocate any moved payment that lost its allocations onto canon's pending fees
    for (const pid of movedPaymentIds) {
      const p = await db.payment.findUnique({
        where: { id: pid },
        include: { allocations: true },
      });
      if (!p || p.isVoided || p.allocations.length > 0) continue;
      let remaining = Number(p.amount);
      const canonFees = await db.annualFee.findMany({
        where: { organizationId: oid, memberId: canon.id },
        include: { allocations: { include: { payment: true } } },
        orderBy: { financialYear: { startDate: "asc" } },
      });
      for (const f of canonFees) {
        if (remaining <= 0) break;
        if (["Waived", "Exempted", "Cancelled"].includes(f.status)) continue;
        let paid = 0;
        for (const al of f.allocations) if (!al.payment.isVoided) paid += Number(al.amount);
        const pend = Math.max(0, Number(f.feeAmount) - paid);
        if (pend <= 0) continue;
        const give = Math.min(pend, remaining);
        await db.paymentAllocation.create({
          data: {
            organizationId: oid,
            paymentId: p.id,
            annualFeeId: f.id,
            amount: new Prisma.Decimal(give),
          },
        });
        await db.annualFee.update({
          where: { id: f.id },
          data: { status: give >= pend ? "Paid" : "Partial" },
        });
        remaining -= give;
      }
    }
    await db.member.delete({ where: { id: dup.id } });
    console.log(`    merged & removed ${dup.memberCode}`);
  }

  // 2) remove non-roster receipt-book people entirely
  for (const name of REMOVE_NAMES) {
    const m = await findMember(name);
    if (!m) {
      console.log(`  [skip] not found: "${name}"`);
      continue;
    }
    const [fees, payments, receipts] = await Promise.all([
      db.annualFee.count({ where: { memberId: m.id } }),
      db.payment.count({ where: { memberId: m.id } }),
      db.receipt.count({ where: { memberId: m.id } }),
    ]);
    console.log(
      `  REMOVE "${name}"(${m.memberCode}): ${fees} fees, ${payments} payments, ${receipts} receipts`,
    );
    if (!APPLY) continue;
    await db.receipt.deleteMany({ where: { memberId: m.id } });
    await db.payment.deleteMany({ where: { memberId: m.id } }); // cascades allocations
    await db.annualFee.deleteMany({ where: { memberId: m.id } });
    await db.member.delete({ where: { id: m.id } });
    console.log(`    removed ${m.memberCode}`);
  }

  const memberCount = await db.member.count({ where: { organizationId: oid } });
  console.log(`  => member count now: ${memberCount}`);

  // 3) remove dummy income + dummy expenses, import real expenses
  console.log(`\n===== EXPENSES (${APPLY ? "APPLY" : "DRY-RUN"}) =====`);
  const dummyExpenseDescs = ["Annual event", "Electricity bill", "Mahaprasad"];
  const dummyIncomeFrom = ["Shri. R. Malusare", "Local Trust", "Kharabwadi Co-op Bank"];
  const delExp = await db.expense.count({
    where: { organizationId: oid, description: { in: dummyExpenseDescs } },
  });
  const delInc = await db.income.count({
    where: { organizationId: oid, receivedFrom: { in: dummyIncomeFrom } },
  });
  console.log(`  dummy to remove: ${delExp} expenses, ${delInc} incomes`);

  const expenses = await readExpenses();
  const byYear = new Map<number, number>();
  let grand = 0;
  for (const e of expenses) {
    byYear.set(e.year, (byYear.get(e.year) ?? 0) + e.amount);
    grand += e.amount;
  }
  for (const [y, tot] of [...byYear.entries()].sort((a, b) => b[0] - a[0])) {
    const n = expenses.filter((e) => e.year === y).length;
    console.log(`  ${y}: ${n} expense lines, total ₹${tot.toLocaleString("en-IN")}`);
  }
  console.log(`  GRAND TOTAL real expenses: ₹${grand.toLocaleString("en-IN")} (${expenses.length} lines)`);

  if (!APPLY) {
    console.log("\n(dry-run; re-run with --apply to write)");
    return;
  }

  await db.expense.deleteMany({
    where: { organizationId: oid, description: { in: dummyExpenseDescs } },
  });
  await db.income.deleteMany({
    where: { organizationId: oid, receivedFrom: { in: dummyIncomeFrom } },
  });

  const cashMode = await db.paymentMode.upsert({
    where: { organizationId_name: { organizationId: oid, name: "Cash" } },
    update: {},
    create: { organizationId: oid, name: "Cash" },
  });
  const catId = new Map<string, string>();
  const ensureCat = async (name: string) => {
    if (catId.has(name)) return catId.get(name)!;
    const c = await db.expenseCategory.upsert({
      where: { organizationId_name: { organizationId: oid, name } },
      update: {},
      create: { organizationId: oid, name },
    });
    catId.set(name, c.id);
    return c.id;
  };

  let created = 0;
  for (const e of expenses) {
    const cat = expenseCategory(e.item);
    await db.expense.create({
      data: {
        organizationId: oid,
        amount: new Prisma.Decimal(e.amount),
        expenseCategoryId: await ensureCat(cat),
        paidTo: e.item,
        description: e.item,
        paymentModeId: cashMode.id,
        expenseDate: e.date,
      },
    });
    created++;
  }
  console.log(`  created ${created} real expenses across ${byYear.size} years`);
  const totalExp = await db.expense.count({ where: { organizationId: oid } });
  console.log(`  => expense rows now: ${totalExp}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
