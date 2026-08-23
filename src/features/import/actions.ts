"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { withAction, type ActionContext } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { parseSpreadsheet, pick, type Row } from "@/lib/import/parse";
import { parseAmount } from "@/lib/money/money";
import { nextMemberCode } from "@/lib/membercode/generate";
import { feePending, deriveStatus } from "@/lib/finance/calc";

export type ImportRowResult = {
  index: number;
  label: string;
  status: "ok" | "duplicate" | "error";
  message?: string;
};
export type ImportResult = {
  type: string;
  dryRun: boolean;
  total: number;
  ok: number;
  duplicates: number;
  errors: number;
  imported: number;
  rows: ImportRowResult[];
  parseError?: string;
};

function amountOrThrow(v: string): Prisma.Decimal {
  return parseAmount(v); // throws on invalid/negative
}

// ------------------------------------------------------------------- members
async function importMembers(
  ctx: ActionContext,
  rows: Row[],
  dryRun: boolean,
): Promise<ImportResult> {
  const existing = await db.member.findMany({
    select: { memberCode: true, mobile: true },
  });
  const codes = new Set(existing.map((m) => m.memberCode.toLowerCase()));
  const mobiles = new Set(existing.map((m) => m.mobile));
  const statuses = await db.memberStatus.findMany();
  const statusByName = new Map(statuses.map((s) => [s.name.toLowerCase(), s]));
  const defaultStatus = statuses.find((s) => !s.isTerminal) ?? statuses[0];
  const types = await db.membershipType.findMany();
  const typeByName = new Map(types.map((t) => [t.name.toLowerCase(), t.id]));

  const out: ImportRowResult[] = [];
  let ok = 0,
    dup = 0,
    err = 0,
    imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = pick(row, ["name", "fullname", "membername"]);
    const mobile = pick(row, ["mobile", "mobilenumber", "phone", "contact"]);
    const code = pick(row, ["memberid", "membercode", "code"]);
    const label = name || code || `Row ${i + 2}`;

    if (!name || !mobile) {
      out.push({ index: i, label, status: "error", message: "Name and mobile are required" });
      err++;
      continue;
    }
    if (!defaultStatus) {
      out.push({ index: i, label, status: "error", message: "No member status configured" });
      err++;
      continue;
    }
    const isDup =
      (code && codes.has(code.toLowerCase())) || (!code && mobiles.has(mobile));
    if (isDup) {
      out.push({ index: i, label, status: "duplicate", message: "Already exists" });
      dup++;
      continue;
    }
    const statusName = pick(row, ["status"]).toLowerCase();
    const status = (statusName && statusByName.get(statusName)) || defaultStatus;

    if (!dryRun) {
      try {
        const memberCode = code || (await nextMemberCode(ctx.organizationId));
        await db.member.create({
          data: {
            organizationId: ctx.organizationId,
            memberCode,
            fullName: name,
            mobile,
            whatsappNumber: pick(row, ["whatsapp", "whatsappnumber"]) || null,
            email: pick(row, ["email"]) || null,
            address: pick(row, ["address"]) || null,
            area: pick(row, ["area", "locality"]) || null,
            statusId: status.id,
            membershipTypeId:
              typeByName.get(pick(row, ["membershiptype", "type"]).toLowerCase()) ??
              null,
            createdBy: ctx.user.id,
          },
        });
        codes.add(memberCode.toLowerCase());
        imported++;
      } catch (e) {
        out.push({ index: i, label, status: "error", message: (e as Error).message });
        err++;
        continue;
      }
    }
    if (code) codes.add(code.toLowerCase());
    mobiles.add(mobile);
    out.push({ index: i, label, status: "ok" });
    ok++;
  }
  return summarize("members", dryRun, out, ok, dup, err, imported);
}

// ------------------------------------------------------------- member lookup
async function buildMemberMaps() {
  const members = await db.member.findMany({
    select: { id: true, memberCode: true, mobile: true, fullName: true },
  });
  const byCode = new Map<string, string>();
  const byMobile = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const m of members) {
    byCode.set(m.memberCode.toLowerCase(), m.id);
    byMobile.set(m.mobile, m.id);
    byName.set(m.fullName.toLowerCase(), m.id);
  }
  return { byCode, byMobile, byName };
}
function resolveMemberId(
  row: Row,
  maps: { byCode: Map<string, string>; byMobile: Map<string, string>; byName: Map<string, string> },
): string | null {
  const code = pick(row, ["memberid", "membercode", "code"]);
  if (code && maps.byCode.has(code.toLowerCase()))
    return maps.byCode.get(code.toLowerCase())!;
  const mobile = pick(row, ["mobile", "mobilenumber", "phone"]);
  if (mobile && maps.byMobile.has(mobile)) return maps.byMobile.get(mobile)!;
  const name = pick(row, ["membername", "name"]);
  if (name && maps.byName.has(name.toLowerCase()))
    return maps.byName.get(name.toLowerCase())!;
  return null;
}

// ---------------------------------------------------------------------- fees
async function importFees(
  ctx: ActionContext,
  rows: Row[],
  dryRun: boolean,
): Promise<ImportResult> {
  const maps = await buildMemberMaps();
  const years = await db.financialYear.findMany();
  const yearByLabel = new Map(years.map((y) => [y.label.toLowerCase(), y]));
  const existingFees = await db.annualFee.findMany({
    select: { memberId: true, financialYearId: true },
  });
  const feeKey = new Set(
    existingFees.map((f) => `${f.memberId}:${f.financialYearId}`),
  );
  let openingModeId: string | null = null;

  const out: ImportRowResult[] = [];
  let ok = 0,
    dup = 0,
    err = 0,
    imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const memberId = resolveMemberId(row, maps);
    const yearLabel = pick(row, ["financialyear", "year", "fy"]);
    const label = `${pick(row, ["membername", "name", "memberid", "membercode"]) || "?"} · ${yearLabel || "?"}`;
    if (!memberId) {
      out.push({ index: i, label, status: "error", message: "Member not found" });
      err++;
      continue;
    }
    if (!yearLabel) {
      out.push({ index: i, label, status: "error", message: "Financial year required" });
      err++;
      continue;
    }
    let fee: Prisma.Decimal, paid: Prisma.Decimal;
    try {
      fee = amountOrThrow(pick(row, ["feeamount", "fee", "amount"]) || "0");
      const paidStr = pick(row, ["paidamount", "paid"]);
      paid = paidStr ? amountOrThrow(paidStr) : new Prisma.Decimal(0);
    } catch (e) {
      out.push({ index: i, label, status: "error", message: (e as Error).message });
      err++;
      continue;
    }

    let year = yearByLabel.get(yearLabel.toLowerCase());
    const yr = parseInt(yearLabel.slice(0, 4), 10);
    if (year && feeKey.has(`${memberId}:${year.id}`)) {
      out.push({ index: i, label, status: "duplicate", message: "Fee already exists" });
      dup++;
      continue;
    }

    if (!dryRun) {
      try {
        if (!year) {
          year = await db.financialYear.create({
            data: {
              organizationId: ctx.organizationId,
              label: yearLabel,
              feeAmount: fee,
              startDate: new Date(Date.UTC(Number.isFinite(yr) ? yr : 2000, 3, 1)),
              endDate: new Date(Date.UTC((Number.isFinite(yr) ? yr : 2000) + 1, 2, 31)),
            },
          });
          yearByLabel.set(yearLabel.toLowerCase(), year);
        }
        const annualFee = await db.annualFee.create({
          data: {
            organizationId: ctx.organizationId,
            memberId,
            financialYearId: year.id,
            feeAmount: fee,
            createdBy: ctx.user.id,
          },
        });
        if (paid.greaterThan(0)) {
          if (!openingModeId) {
            const mode = await db.paymentMode.upsert({
              where: {
                organizationId_name: {
                  organizationId: ctx.organizationId,
                  name: "Opening Balance",
                },
              },
              update: {},
              create: { organizationId: ctx.organizationId, name: "Opening Balance" },
            });
            openingModeId = mode.id;
          }
          const alloc = paid.greaterThan(fee) ? fee : paid;
          const payment = await db.payment.create({
            data: {
              organizationId: ctx.organizationId,
              memberId,
              amount: paid,
              paymentModeId: openingModeId,
              referenceNumber: "IMPORT",
              paymentDate: year.startDate,
              collectedBy: ctx.user.id,
              notes: "Imported opening balance",
            },
          });
          await db.paymentAllocation.create({
            data: {
              organizationId: ctx.organizationId,
              paymentId: payment.id,
              annualFeeId: annualFee.id,
              amount: alloc,
            },
          });
          await db.annualFee.update({
            where: { id: annualFee.id },
            data: { status: deriveStatus(fee, alloc) },
          });
        }
        feeKey.add(`${memberId}:${year.id}`);
        imported++;
      } catch (e) {
        out.push({ index: i, label, status: "error", message: (e as Error).message });
        err++;
        continue;
      }
    } else if (year) {
      feeKey.add(`${memberId}:${year.id}`);
    }
    out.push({ index: i, label, status: "ok" });
    ok++;
  }
  return summarize("fees", dryRun, out, ok, dup, err, imported);
}

// ------------------------------------------------------------------ payments
async function importPayments(
  ctx: ActionContext,
  rows: Row[],
  dryRun: boolean,
): Promise<ImportResult> {
  const maps = await buildMemberMaps();
  const modes = await db.paymentMode.findMany();
  const modeByName = new Map(modes.map((m) => [m.name.toLowerCase(), m.id]));
  const defaultMode = modes.find((m) => m.name === "Cash") ?? modes[0];

  const out: ImportRowResult[] = [];
  let ok = 0,
    dup = 0,
    err = 0,
    imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const memberId = resolveMemberId(row, maps);
    const label = pick(row, ["membername", "name", "memberid", "membercode"]) || `Row ${i + 2}`;
    if (!memberId) {
      out.push({ index: i, label, status: "error", message: "Member not found" });
      err++;
      continue;
    }
    if (!defaultMode) {
      out.push({ index: i, label, status: "error", message: "No payment mode configured" });
      err++;
      continue;
    }
    let amount: Prisma.Decimal;
    try {
      amount = amountOrThrow(pick(row, ["amount", "paidamount", "paid"]));
    } catch (e) {
      out.push({ index: i, label, status: "error", message: (e as Error).message });
      err++;
      continue;
    }
    const modeName = pick(row, ["paymentmode", "mode"]).toLowerCase();
    const modeId = (modeName && modeByName.get(modeName)) || defaultMode.id;
    const dateStr = pick(row, ["date", "paymentdate"]);
    const date = dateStr ? new Date(dateStr) : new Date();

    if (!dryRun) {
      try {
        const payment = await db.payment.create({
          data: {
            organizationId: ctx.organizationId,
            memberId,
            amount,
            paymentModeId: modeId,
            referenceNumber: pick(row, ["reference", "referencenumber", "txn"]) || null,
            paymentDate: isNaN(date.getTime()) ? new Date() : date,
            collectedBy: ctx.user.id,
            notes: "Imported",
          },
        });
        // auto-allocate oldest-first across the member's pending fees
        const fees = await db.annualFee.findMany({
          where: { memberId },
          include: { financialYear: true, allocations: { include: { payment: true } } },
          orderBy: { financialYear: { startDate: "asc" } },
        });
        let remaining = amount;
        for (const f of fees) {
          if (remaining.lessThanOrEqualTo(0)) break;
          let fpaid = new Prisma.Decimal(0);
          for (const a of f.allocations)
            if (!a.payment.isVoided) fpaid = fpaid.plus(a.amount);
          const pend = feePending(f.feeAmount, fpaid, f.status);
          if (pend.lessThanOrEqualTo(0)) continue;
          const give = remaining.greaterThan(pend) ? pend : remaining;
          await db.paymentAllocation.create({
            data: {
              organizationId: ctx.organizationId,
              paymentId: payment.id,
              annualFeeId: f.id,
              amount: give,
            },
          });
          await db.annualFee.update({
            where: { id: f.id },
            data: { status: deriveStatus(f.feeAmount, fpaid.plus(give)) },
          });
          remaining = remaining.minus(give);
        }
        imported++;
      } catch (e) {
        out.push({ index: i, label, status: "error", message: (e as Error).message });
        err++;
        continue;
      }
    }
    out.push({ index: i, label, status: "ok" });
    ok++;
  }
  return summarize("payments", dryRun, out, ok, dup, err, imported);
}

function summarize(
  type: string,
  dryRun: boolean,
  rows: ImportRowResult[],
  ok: number,
  duplicates: number,
  errors: number,
  imported: number,
): ImportResult {
  return {
    type,
    dryRun,
    total: rows.length,
    ok,
    duplicates,
    errors,
    imported,
    rows: rows.slice(0, 200),
  };
}

export async function runImport(formData: FormData): Promise<ImportResult> {
  const type = String(formData.get("type") || "");
  const dryRun = String(formData.get("dryRun") || "true") === "true";
  const file = formData.get("file");
  const empty = (parseError: string): ImportResult => ({
    type,
    dryRun,
    total: 0,
    ok: 0,
    duplicates: 0,
    errors: 0,
    imported: 0,
    rows: [],
    parseError,
  });
  if (!(file instanceof File) || file.size === 0) return empty("No file uploaded");

  let rows: Row[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    rows = await parseSpreadsheet(buffer, file.name);
  } catch (e) {
    return empty(`Could not parse file: ${(e as Error).message}`);
  }
  if (!rows.length) return empty("No data rows found");

  return withAction({ permission: "data.import" }, async (ctx) => {
    if (type === "members") return importMembers(ctx, rows, dryRun);
    if (type === "fees") return importFees(ctx, rows, dryRun);
    if (type === "payments") return importPayments(ctx, rows, dryRun);
    return empty("Unknown import type");
  });
}
