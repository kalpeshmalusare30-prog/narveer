import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

export async function getOrgDefaultFee(): Promise<string> {
  return withAction({ permission: "financialyear.view" }, async (ctx) => {
    const org = await rawDb.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { defaultMembershipFee: true },
    });
    return org?.defaultMembershipFee.toString() ?? "0";
  });
}

export async function listFinancialYears() {
  return withAction({ permission: "financialyear.view" }, async () =>
    db.financialYear.findMany({ orderBy: { startDate: "desc" } }),
  );
}

export async function getFinancialYear(id: string) {
  return withAction({ permission: "financialyear.view" }, async () =>
    db.financialYear.findFirst({ where: { id } }),
  );
}

export async function getActiveFinancialYear() {
  return withAction({ permission: "financialyear.view" }, async () =>
    db.financialYear.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
    }),
  );
}
