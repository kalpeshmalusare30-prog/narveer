import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

/**
 * Create (or reset) the Treasurer login for the primary organization.
 *   npx tsx scripts/create-treasurer.ts            (uses .env DATABASE_URL)
 * Login: treasurer / Treasurer@123 — ask the treasurer to change it later.
 */
const db = new PrismaClient();

async function main() {
  const org = await db.organization.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new Error("No organization found");

  const role = await db.role.findFirst({
    where: { organizationId: org.id, name: "Treasurer" },
  });
  if (!role) throw new Error("Treasurer role not found — run npm run seed first");

  const passwordHash = await hashPassword("Treasurer@123");
  const user = await db.user.upsert({
    where: { loginId: "treasurer" },
    update: { passwordHash, isActive: true },
    create: {
      organizationId: org.id,
      fullName: "खजिनदार (Treasurer)",
      loginId: "treasurer",
      email: null,
      passwordHash,
      locale: "mr",
    },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  console.log(
    `Treasurer ready on ${org.shortName}: loginId=treasurer (role ${role.name})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
