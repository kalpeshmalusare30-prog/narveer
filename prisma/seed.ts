import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PERMISSIONS } from "../src/lib/rbac/permissions";
import { SYSTEM_ROLES } from "../src/lib/rbac/roles";
import { hashPassword } from "../src/lib/auth/password";
import { LocalStorageProvider } from "../src/lib/storage/local";

const db = new PrismaClient();

export async function seed(): Promise<void> {
  // 1. Permission catalog
  await db.permission.createMany({
    data: PERMISSIONS.map((key) => ({ key })),
    skipDuplicates: true,
  });

  // 2. Platform super admin (no organization)
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

  // 3. Initial organization: Narveer Tanaji Malusare Pratishthan
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

  // 3b. Organization logo (optional; from project-root logo.png)
  try {
    const logo = await readFile(path.join(process.cwd(), "logo.png"));
    const storage = new LocalStorageProvider();
    const ref = await storage.save("logos/ntmp.png", logo);
    await db.organization.update({
      where: { id: org.id },
      data: { logoRef: ref },
    });
  } catch {
    // logo is optional
  }

  // 4. System roles + their permissions
  const roleByName: Record<string, string> = {};
  for (const r of SYSTEM_ROLES) {
    const role = await db.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: r.name } },
      update: { description: r.description, isSystem: true },
      create: {
        organizationId: org.id,
        name: r.name,
        description: r.description,
        isSystem: true,
      },
    });
    roleByName[r.name] = role.id;
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({
      data: r.permissions.map((permissionKey) => ({
        roleId: role.id,
        permissionKey,
      })),
      skipDuplicates: true,
    });
  }

  // 5. Organization admin user + role assignment
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

  // 6. Default membership types + member statuses
  for (const name of ["General", "Life", "Honorary"]) {
    await db.membershipType.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { organizationId: org.id, name },
    });
  }
  const statuses = [
    { name: "Active", isTerminal: false },
    { name: "Inactive", isTerminal: false },
    { name: "Suspended", isTerminal: false },
    { name: "Left Organization", isTerminal: true },
  ];
  for (const s of statuses) {
    await db.memberStatus.upsert({
      where: { organizationId_name: { organizationId: org.id, name: s.name } },
      update: {},
      create: { organizationId: org.id, name: s.name, isTerminal: s.isTerminal },
    });
  }
}

// Run only when invoked directly (tsx prisma/seed.ts), not when imported by tests.
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
