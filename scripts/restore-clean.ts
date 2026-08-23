import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const APPLY = process.argv.includes("--apply");

async function main() {
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("NTMP org not found");
  const oid = org.id;
  const where = { organizationId: oid };

  const counts = {
    members: await db.member.count({ where }),
    fys: await db.financialYear.count({ where }),
    income: await db.income.count({ where }),
    expense: await db.expense.count({ where }),
    users: await db.user.count(),
    types: await db.membershipType.count({ where: { ...where, name: { startsWith: "Type " } } }),
    statuses: await db.memberStatus.count({ where: { ...where, name: { startsWith: "Status " } } }),
    roles: await db.role.count({ where: { ...where, name: { startsWith: "Role " } } }),
    testUsers: await db.user.count({ where: { loginId: { notIn: ["admin", "superadmin"] } } }),
  };
  console.log(`\n===== RESTORE CLEAN (${APPLY ? "APPLY" : "DRY-RUN"}) =====`);
  console.log("  current:", JSON.stringify(counts));

  if (!APPLY) {
    console.log("\n(dry-run; re-run with --apply, then run the load scripts)");
    return;
  }

  // 1) transactional data (FK-safe order)
  await db.paymentAllocation.deleteMany({ where });
  await db.receipt.deleteMany({ where });
  await db.payment.deleteMany({ where });
  await db.annualFee.deleteMany({ where });
  await db.whatsAppMessage.deleteMany({ where });
  await db.notification.deleteMany({ where });
  await db.income.deleteMany({ where });
  await db.expense.deleteMany({ where });
  await db.financialYear.deleteMany({ where });
  await db.member.deleteMany({ where });

  // 2) test config created by E2E (timestamped names)
  await db.membershipType.deleteMany({ where: { ...where, name: { startsWith: "Type " } } });
  await db.memberStatus.deleteMany({ where: { ...where, name: { startsWith: "Status " } } });

  // 3) test users (keep seeded admin + superadmin); userRoles cascade on delete
  await db.user.deleteMany({ where: { loginId: { notIn: ["admin", "superadmin"] } } });
  // 4) test roles (cascade removes any remaining userRoles)
  await db.role.deleteMany({ where: { ...where, name: { startsWith: "Role " } } });

  // 5) reset code sequences so reloaded members become NTM0001..NTM00NN again
  await db.organization.update({
    where: { id: oid },
    data: { memberCodeSeq: 0, receiptSeq: 0 },
  });

  const after = {
    members: await db.member.count({ where }),
    fys: await db.financialYear.count({ where }),
    income: await db.income.count({ where }),
    expense: await db.expense.count({ where }),
    users: await db.user.count(),
  };
  console.log("  after clean:", JSON.stringify(after));
  console.log("  seq reset. Now run: load-vargani-xlsx, cleanup-and-expenses --apply, load-income --apply");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
