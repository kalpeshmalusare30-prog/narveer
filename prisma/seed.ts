import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "../src/lib/auth/password";
import { provisionOrgDefaults } from "../src/lib/org/provision";

const db = new PrismaClient();

export async function seed(): Promise<void> {
  // 1. Platform super admin (no organization)
  await db.user.upsert({
    where: { loginId: "superadmin" },
    update: {},
    create: {
      fullName: "Platform Super Admin",
      loginId: "superadmin",
      email: "superadmin@example.com",
      passwordHash: await hashPassword("super123"),
      isSuperAdmin: true,
    },
  });

  // 2. Initial organization: Narveer Tanaji Malusare Pratishthan
  const org = await db.organization.upsert({
    where: { shortName: "NTMP" },
    update: {},
    create: {
      name: "Narveer Tanaji Malusare Pratishthan",
      shortName: "NTMP",
      address: "Kharabwadi",
      city: "Kharabwadi",
      state: "Maharashtra",
      contactNumber: "",
      defaultLocale: "mr",
      memberCodePrefix: "NTM",
      receiptNumberPrefix: "NTM",
      defaultMembershipFee: "1000",
      setupCompleted: true,
    },
  });

  // 2b. Organization logo (optional; from project-root logo.png).
  // Stored as a base64 data URI directly on the org row so it works on
  // serverless hosts (Vercel) with no persistent filesystem.
  try {
    const logo = await readFile(path.join(process.cwd(), "logo.png"));
    await db.organization.update({
      where: { id: org.id },
      data: { logoDataUri: `data:image/png;base64,${logo.toString("base64")}` },
    });
  } catch {
    // logo is optional
  }

  // 3. Provision all per-org defaults (permissions, roles, types, statuses,
  //    payment modes, income/expense categories, WhatsApp templates).
  const roleByName = await provisionOrgDefaults(db, org.id);

  // 4. Organization admin user + role assignment
  const admin = await db.user.upsert({
    where: { loginId: "admin" },
    update: {},
    create: {
      organizationId: org.id,
      fullName: "Organization Admin",
      loginId: "admin",
      email: "admin@ntmp.org",
      passwordHash: await hashPassword("admin123"),
      locale: "mr",
    },
  });
  await db.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: roleByName["Org Admin"] },
    },
    update: {},
    create: { userId: admin.id, roleId: roleByName["Org Admin"] },
  });
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => db.$disconnect())
    .catch(async (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
}
