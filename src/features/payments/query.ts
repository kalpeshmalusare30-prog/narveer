import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listPayments() {
  return withAction({ permission: "payment.view" }, async () =>
    db.payment.findMany({
      include: {
        member: true,
        paymentMode: true,
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function listMemberPayments(memberId: string) {
  return withAction({ permission: "payment.view" }, async () =>
    db.payment.findMany({
      where: { memberId },
      include: {
        paymentMode: true,
        receipt: true,
        allocations: { include: { annualFee: { include: { financialYear: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function getPaymentModes() {
  return withAction({ permission: "payment.create" }, async () =>
    db.paymentMode.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  );
}
