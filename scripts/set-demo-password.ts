import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

// Change a login's password. Useful before exposing a public demo so the
// documented default (admin/admin123) can't be used by anyone with the link.
//
//   npx tsx scripts/set-demo-password.ts "new-password"              -> changes "admin"
//   npx tsx scripts/set-demo-password.ts superadmin "new-password"   -> changes "superadmin"
//
// Runs against whatever DATABASE_URL is set in the environment (point it at the
// cloud/demo DB when hardening the demo).

const args = process.argv.slice(2);
const loginId = args.length >= 2 ? args[0] : "admin";
const newPassword = args.length >= 2 ? args[1] : args[0];

async function main(): Promise<void> {
  if (!newPassword) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: npx tsx scripts/set-demo-password.ts [loginId] "<new-password>"',
    );
    process.exit(1);
  }
  const db = new PrismaClient();
  const user = await db.user.findFirst({ where: { loginId } });
  if (!user) {
    // eslint-disable-next-line no-console
    console.error(`No user with loginId "${loginId}".`);
    await db.$disconnect();
    process.exit(1);
  }
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  // eslint-disable-next-line no-console
  console.log(`Password updated for "${loginId}".`);
  await db.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
