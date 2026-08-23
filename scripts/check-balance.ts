import { config } from "dotenv";
config();
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const org = await db.organization.findUnique({ where: { shortName: "NTMP" } });
  if (!org) throw new Error("no org");
  const oid = org.id;
  const [pay, inc, exp, expByYear] = await Promise.all([
    db.payment.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
    db.income.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
    db.expense.aggregate({ _sum: { amount: true }, where: { organizationId: oid, isVoided: false } }),
    db.expense.findMany({ where: { organizationId: oid }, select: { amount: true, expenseDate: true } }),
  ]);
  const membership = Number(pay._sum.amount ?? 0);
  const other = Number(inc._sum.amount ?? 0);
  const expense = Number(exp._sum.amount ?? 0);
  const byYear = new Map<number, number>();
  for (const e of expByYear) {
    const y = new Date(e.expenseDate).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + Number(e.amount));
  }
  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
  console.log("membership collection:", inr(membership));
  console.log("other income        :", inr(other));
  console.log("total income        :", inr(membership + other));
  console.log("total expense       :", inr(expense));
  console.log("BALANCE             :", inr(membership + other - expense));
  console.log("expenses by year:");
  for (const [y, t] of [...byYear.entries()].sort((a, b) => b[0] - a[0]))
    console.log(`   ${y}: ${inr(t)}`);
}
main().then(() => db.$disconnect());
