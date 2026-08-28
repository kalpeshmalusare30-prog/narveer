import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";

export async function listDonations() {
  return withAction({ permission: "donation.view" }, async () =>
    db.donation.findMany({
      include: { member: true, paymentMode: true },
      orderBy: { donationDate: "desc" },
    }),
  );
}

export async function getDonationsTotal(): Promise<string> {
  return withAction({ permission: "donation.view" }, async () => {
    const agg = await db.donation.aggregate({
      _sum: { amount: true },
      where: { isVoided: false },
    });
    return new Prisma.Decimal(agg._sum.amount ?? 0).toString();
  });
}

export async function getDonationFormData() {
  return withAction({ permission: "donation.create" }, async () => {
    const [members, modes] = await Promise.all([
      db.member.findMany({
        where: { isActive: true },
        select: {
          id: true,
          fullName: true,
          fullNameEn: true,
          memberCode: true,
        },
        orderBy: { fullName: "asc" },
      }),
      db.paymentMode.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { members, modes };
  });
}
