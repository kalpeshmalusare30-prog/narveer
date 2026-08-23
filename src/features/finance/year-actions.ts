"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { parseAmount } from "@/lib/money/money";

function deriveYearDates(label: string, startMonth: number, endMonth: number) {
  const parsed = parseInt(label.slice(0, 4), 10);
  const startYear = Number.isFinite(parsed) ? parsed : new Date().getFullYear();
  const endYear = endMonth < startMonth ? startYear + 1 : startYear;
  const startDate = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const endDate = new Date(Date.UTC(endYear, endMonth, 0)); // last day of endMonth
  return { startDate, endDate };
}

export async function createFinancialYear(input: {
  label: string;
  feeAmount: string;
}) {
  const data = z
    .object({
      label: z.string().trim().min(1, "Required"),
      feeAmount: z.string(),
    })
    .parse(input);
  const fee = parseAmount(data.feeAmount);
  return withAction({ permission: "financialyear.manage" }, async (ctx) => {
    const dup = await db.financialYear.findFirst({
      where: { label: data.label },
    });
    if (dup) throw new Error("DUPLICATE");
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { financialYearStart: true, financialYearEnd: true },
    });
    const { startDate, endDate } = deriveYearDates(
      data.label,
      org?.financialYearStart ?? 4,
      org?.financialYearEnd ?? 3,
    );
    const year = await db.financialYear.create({
      data: {
        organizationId: ctx.organizationId,
        label: data.label,
        feeAmount: fee,
        startDate,
        endDate,
      },
    });
    await writeAudit({
      action: "create",
      module: "financialyears",
      recordType: "FinancialYear",
      recordId: year.id,
      newValue: { label: year.label, feeAmount: fee.toString() },
    });
    return year;
  });
}

export async function setYearActive(id: string, active: boolean) {
  return withAction({ permission: "financialyear.manage" }, async () => {
    await db.financialYear.update({ where: { id }, data: { isActive: active } });
    await writeAudit({
      action: active ? "activate" : "deactivate",
      module: "financialyears",
      recordType: "FinancialYear",
      recordId: id,
    });
  });
}

export async function setYearClosed(id: string, closed: boolean) {
  return withAction({ permission: "financialyear.manage" }, async () => {
    await db.financialYear.update({ where: { id }, data: { isClosed: closed } });
    await writeAudit({
      action: closed ? "close" : "reopen",
      module: "financialyears",
      recordType: "FinancialYear",
      recordId: id,
    });
  });
}

// --- Form / client adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function createFinancialYearForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createFinancialYear({
      label: (formData.get("label") ?? "").toString(),
      feeAmount: (formData.get("feeAmount") ?? "0").toString(),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function toggleYearActiveAction(id: string, active: boolean) {
  await setYearActive(id, active);
}
export async function toggleYearClosedAction(id: string, closed: boolean) {
  await setYearClosed(id, closed);
}
