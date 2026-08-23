"use server";

import { z } from "zod";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { parseAmount } from "@/lib/money/money";

const orgDetails = z.object({
  name: z.string().trim().min(1, "Required"),
  shortName: z.string().trim().min(1, "Required"),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  contactNumber: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
});
export type OrgDetailsInput = z.infer<typeof orgDetails>;

export async function saveOrgDetails(input: OrgDetailsInput) {
  const data = orgDetails.parse(input);
  return withAction({ permission: "settings.org.manage" }, async (ctx) => {
    await rawDb.organization.update({
      where: { id: ctx.organizationId },
      data: {
        name: data.name,
        shortName: data.shortName,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        contactNumber: data.contactNumber ?? null,
        email: data.email ?? null,
      },
    });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "Organization",
      recordId: ctx.organizationId,
    });
  });
}

const financialConfig = z.object({
  financialYearStart: z.coerce.number().int().min(1).max(12),
  financialYearEnd: z.coerce.number().int().min(1).max(12),
  defaultMembershipFee: z.string(),
  receiptNumberPrefix: z.string().trim().min(1, "Required"),
  memberCodePrefix: z.string().trim().min(1, "Required"),
});
export type FinancialConfigInput = z.infer<typeof financialConfig>;

export async function saveFinancialConfig(input: FinancialConfigInput) {
  const data = financialConfig.parse(input);
  const fee = parseAmount(data.defaultMembershipFee); // throws on invalid/negative
  return withAction({ permission: "settings.org.manage" }, async (ctx) => {
    await rawDb.organization.update({
      where: { id: ctx.organizationId },
      data: {
        financialYearStart: data.financialYearStart,
        financialYearEnd: data.financialYearEnd,
        defaultMembershipFee: fee,
        receiptNumberPrefix: data.receiptNumberPrefix,
        memberCodePrefix: data.memberCodePrefix,
      },
    });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "Organization",
      recordId: ctx.organizationId,
    });
  });
}

export async function completeSetup() {
  return withAction({ permission: "settings.org.manage" }, async (ctx) => {
    await rawDb.organization.update({
      where: { id: ctx.organizationId },
      data: { setupCompleted: true },
    });
  });
}

// --- Form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function saveOrgDetailsForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await saveOrgDetails({
      name: (formData.get("name") ?? "").toString(),
      shortName: (formData.get("shortName") ?? "").toString(),
      address: (formData.get("address") ?? "").toString() || null,
      city: (formData.get("city") ?? "").toString() || null,
      state: (formData.get("state") ?? "").toString() || null,
      contactNumber: (formData.get("contactNumber") ?? "").toString() || null,
      email: (formData.get("email") ?? "").toString() || null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function saveFinancialConfigForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await saveFinancialConfig({
      financialYearStart: Number(formData.get("financialYearStart") ?? 4),
      financialYearEnd: Number(formData.get("financialYearEnd") ?? 3),
      defaultMembershipFee: (
        formData.get("defaultMembershipFee") ?? "0"
      ).toString(),
      receiptNumberPrefix: (
        formData.get("receiptNumberPrefix") ?? ""
      ).toString(),
      memberCodePrefix: (formData.get("memberCodePrefix") ?? "").toString(),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function completeSetupForm(): Promise<void> {
  await completeSetup();
}
