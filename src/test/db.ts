import { PrismaClient } from "@prisma/client";

// A raw, unscoped client for tests to arrange and assert data directly.
export const testDb = new PrismaClient();

const TABLES = [
  "AuditLog",
  "UserRole",
  "RolePermission",
  "Member",
  "MembershipType",
  "MemberStatus",
  "Role",
  "User",
  "Permission",
  "Organization",
];

export async function resetDb() {
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`,
  );
}
