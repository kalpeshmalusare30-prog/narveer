import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

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
