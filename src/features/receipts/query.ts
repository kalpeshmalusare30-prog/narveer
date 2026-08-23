import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listReceipts() {
  return withAction({ permission: "receipt.view" }, async () =>
    db.receipt.findMany({
      include: {
        member: true,
        payment: { include: { paymentMode: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function getReceiptForPdf(id: string) {
  return withAction({ permission: "receipt.view" }, async () =>
    db.receipt.findFirst({
      where: { id },
      include: {
        member: true,
        payment: {
          include: {
            paymentMode: true,
            allocations: {
              include: { annualFee: { include: { financialYear: true } } },
            },
          },
        },
      },
    }),
  );
}
