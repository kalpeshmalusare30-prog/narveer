import { config } from "dotenv";
config();

import ExcelJS from "exceljs";
import { PrismaClient, Prisma } from "@prisma/client";

const db = new PrismaClient();
const FILE = "C:/Users/Kalpesh/Downloads/सभासद वर्गणी.xlsx";
const VARGANI_SHEET = "सभासद वर्गणी 2026";
const THAKBAKI_SHEET = "थकबाकी";

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    const o = v as { text?: string; result?: unknown };
    return String(o.text ?? o.result ?? "").trim();
  }
  return String(v).trim();
}
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
// matra-insensitive key so spelling variants (मनु/मनू, शि/शी, मालुसरे/मालूसरे)
// resolve to the same member instead of creating phantom duplicates.
const matraKey = (s: string) =>
  norm(s)
    .replace(/[()]/g, "")
    .replace(/ी/g, "ि")
    .replace(/ू/g, "ु")
    .replace(/\s+/g, "");
// Sheets mix in section labels and donation notes; only keep real person rows.
function isJunkName(n: string): boolean {
  if (!n) return true;
  if (/\d/.test(n)) return true; // "2026 चे एकुण खर्च"
  if (/[_&]/.test(n)) return true; // "...&...", "..._५ किलो गुलाब जाम"
  return /(वर्गणी|खर्च|जमा|बाकी|पावती|अन्नदान|किलो|भाजी|गुलाब|एकुण|टीप|प्रसाद|देणगी|फंड|अहवाल|note|total)/i.test(
    n,
  );
}
function num(s: string): number | null {
  const t = s.replace(/[,\s]/g, "");
  if (t === "" || t === "-") return null;
  const n = Number(t);
  return isNaN(n) || n <= 0 ? null : n;
}
function firstMobile(s: string): string | null {
  const m = s.replace(/\s/g, "").split(/[\/,]/)[0];
  return m && /^\d{6,}$/.test(m) ? m : null;
}
const feeForYear = (y: number) => (y <= 2016 ? "500" : y >= 2025 ? "1200" : "1000");
function parseDMY(s: string): Date {
  const m = s.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (!m) return new Date(Date.UTC(2026, 0, 1));
  let y = +m[3];
  if (y < 100) y += 2000;
  return new Date(Date.UTC(y, +m[2] - 1, +m[1]));
}

type VarganiRow = {
  name: string;
  cash: number | null;
  online: number | null;
  place: string;
  mobile: string | null;
};
type ThakRow =
  | { name: string; kind: "arrears"; years: { year: number; amount: number }[] }
  | { name: string; kind: "paid"; total: number; date: Date };

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  // ---- vargani 2026 (dedupe doubled rows) ----
  const vargani: VarganiRow[] = [];
  const seenV = new Set<string>();
  wb.getWorksheet(VARGANI_SHEET)?.eachRow((row, n) => {
    if (n < 4) return;
    const a = (row.values as unknown[]).slice(1);
    const serial = cellStr(a[0]);
    const name = norm(cellStr(a[1]));
    // only the numbered member roster (serial 1..N); skips donation-note and
    // "receipt-book pending" rows that have no member serial.
    if (!/^\d+$/.test(serial)) return;
    if (!name || isJunkName(name) || seenV.has(name)) return;
    seenV.add(name);
    vargani.push({
      name,
      cash: num(cellStr(a[2])),
      online: num(cellStr(a[3])),
      place: cellStr(a[5]) || "ठाणे",
      mobile: firstMobile(cellStr(a[6])),
    });
  });

  // ---- thakbaki (arrears + paid) ----
  const thak: ThakRow[] = [];
  wb.getWorksheet(THAKBAKI_SHEET)?.eachRow((row, n) => {
    if (n < 4) return;
    const a = (row.values as unknown[]).slice(1);
    const anu = cellStr(a[0]);
    const name = norm(cellStr(a[1]));
    if (!name || isJunkName(name) || !/^\d+$/.test(anu)) return;
    const paidIdx = a.findIndex((c) => /PAID/i.test(cellStr(c)));
    if (paidIdx >= 0) {
      let total = num(cellStr(a[paidIdx - 1])) ?? 0;
      if (!total) for (let i = 3; i < paidIdx; i++) total += num(cellStr(a[i])) ?? 0;
      if (total > 0)
        thak.push({ name, kind: "paid", total, date: parseDMY(cellStr(a[paidIdx])) });
      return;
    }
    const years: { year: number; amount: number }[] = [];
    for (let idx = 3; idx <= 14; idx++) {
      const amt = num(cellStr(a[idx]));
      if (amt) years.push({ year: 2015 + (idx - 3), amount: amt });
    }
    if (years.length) thak.push({ name, kind: "arrears", years });
  });

  // ---- org context ----
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("NTMP org not found — run seed first");
  const status = await db.memberStatus.findFirst({
    where: { organizationId: org.id, name: "Active" },
  });
  const type = await db.membershipType.findFirst({
    where: { organizationId: org.id, name: "General" },
  });
  if (!status) throw new Error("Active status missing");

  const modeId = async (name: string) =>
    (
      await db.paymentMode.upsert({
        where: { organizationId_name: { organizationId: org.id, name } },
        update: {},
        create: { organizationId: org.id, name },
      })
    ).id;
  const cashMode = await modeId("Cash");
  const onlineMode = await modeId("Online");

  const fyByYear = new Map<number, { id: string }>();
  for (let y = 2015; y <= 2026; y++) {
    const label = String(y);
    const fy =
      (await db.financialYear.findFirst({
        where: { organizationId: org.id, label },
      })) ??
      (await db.financialYear.create({
        data: {
          organizationId: org.id,
          label,
          feeAmount: feeForYear(y),
          startDate: new Date(Date.UTC(y, 3, 1)),
          endDate: new Date(Date.UTC(y + 1, 2, 31)),
          isActive: y === 2026,
        },
      }));
    fyByYear.set(y, fy);
  }

  // member roster is the numbered vargani list ONLY; thak rows attach to these.
  const memberIdByKey = new Map<string, string>();
  const resolveMember = (name: string) => memberIdByKey.get(matraKey(name)) ?? null;

  const nextCode = async () => {
    const o = await db.organization.update({
      where: { id: org.id },
      data: { memberCodeSeq: { increment: 1 } },
      select: { memberCodePrefix: true, memberCodeSeq: true },
    });
    return `${o.memberCodePrefix}${String(o.memberCodeSeq).padStart(4, "0")}`;
  };
  let membersCreated = 0;
  for (const v of vargani) {
    if (resolveMember(v.name)) continue;
    const m = await db.member.create({
      data: {
        organizationId: org.id,
        memberCode: await nextCode(),
        fullName: v.name,
        mobile: v.mobile ?? null,
        area: v.place ?? null,
        statusId: status.id,
        membershipTypeId: type?.id ?? null,
      },
    });
    memberIdByKey.set(matraKey(v.name), m.id);
    membersCreated++;
  }
  // helper: resolve-or-warn for thak names (never create phantom members)
  const memberOrWarn = (name: string): string | null => {
    const id = resolveMember(name);
    if (!id) console.warn(`  [skip] thakbaki name not in roster: "${name}"`);
    return id;
  };

  const nextReceipt = async () => {
    const o = await db.organization.update({
      where: { id: org.id },
      data: { receiptSeq: { increment: 1 } },
      select: { receiptNumberPrefix: true, receiptSeq: true },
    });
    return `${o.receiptNumberPrefix}${String(o.receiptSeq).padStart(4, "0")}`;
  };

  async function ensureFee(memberId: string, year: number, amount: number) {
    const fy = fyByYear.get(year)!;
    return (
      (await db.annualFee.findFirst({
        where: { organizationId: org.id, memberId, financialYearId: fy.id },
      })) ??
      (await db.annualFee.create({
        data: {
          organizationId: org.id,
          memberId,
          financialYearId: fy.id,
          feeAmount: new Prisma.Decimal(amount),
        },
      }))
    );
  }

  async function autoAllocate(
    memberId: string,
    total: number,
    mode: string,
    date: Date,
  ) {
    const payment = await db.payment.create({
      data: {
        organizationId: org.id,
        memberId,
        amount: new Prisma.Decimal(total),
        paymentModeId: mode,
        paymentDate: date,
        referenceNumber: "IMPORT",
        notes: "Imported payment",
      },
    });
    const fees = await db.annualFee.findMany({
      where: { organizationId: org.id, memberId },
      include: { allocations: { include: { payment: true } } },
      orderBy: { financialYear: { startDate: "asc" } },
    });
    let remaining = total;
    for (const f of fees) {
      if (remaining <= 0) break;
      let paid = 0;
      for (const al of f.allocations) if (!al.payment.isVoided) paid += Number(al.amount);
      const manual = ["Waived", "Exempted", "Cancelled"].includes(f.status);
      const pend = manual ? 0 : Math.max(0, Number(f.feeAmount) - paid);
      if (pend <= 0) continue;
      const give = Math.min(pend, remaining);
      await db.paymentAllocation.create({
        data: {
          organizationId: org.id,
          paymentId: payment.id,
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
    await db.receipt.create({
      data: {
        organizationId: org.id,
        receiptNumber: await nextReceipt(),
        paymentId: payment.id,
        memberId,
      },
    });
  }

  // 1) arrears → historical pending fees
  let arrearsFees = 0;
  for (const t of thak) {
    if (t.kind !== "arrears") continue;
    const memberId = memberOrWarn(t.name);
    if (!memberId) continue;
    for (const y of t.years) {
      await ensureFee(memberId, y.year, y.amount);
      arrearsFees++;
    }
  }

  // 2) 2026 vargani → fee + payment for those who paid
  let v2026Paid = 0,
    v2026Pending = 0;
  for (const v of vargani) {
    const memberId = resolveMember(v.name)!;
    const amount = v.cash ?? v.online ?? null;
    const fee = await ensureFee(memberId, 2026, amount ?? 1200);
    if (amount) {
      const alloc = await db.paymentAllocation.findFirst({
        where: { annualFeeId: fee.id },
      });
      if (!alloc) {
        await autoAllocate(
          memberId,
          amount,
          v.cash ? cashMode : onlineMode,
          new Date(Date.UTC(2026, 2, 15)),
        );
      }
      v2026Paid++;
    } else v2026Pending++;
  }

  // 3) thakbaki paid rows → payment auto-allocated across remaining pending
  let paidPayments = 0;
  for (const t of thak) {
    if (t.kind !== "paid") continue;
    const memberId = memberOrWarn(t.name);
    if (!memberId) continue;
    await autoAllocate(memberId, t.total, cashMode, t.date);
    paidPayments++;
  }

  // Real income/expenses are imported separately (scripts/cleanup-and-expenses.ts
  // from the "वार्षिक अहवाल" sheets). This loader only handles members + fees.

  // eslint-disable-next-line no-console
  console.log(
    `members=${membersCreated} (roster only); arrears fees=${arrearsFees}; 2026 paid=${v2026Paid} pending=${v2026Pending}; thakbaki paid rows=${paidPayments}`,
  );
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
