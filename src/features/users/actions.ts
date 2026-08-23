"use server";

import { z } from "zod";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { hashPassword } from "@/lib/auth/password";

const createInput = z.object({
  fullName: z.string().trim().min(1, "Required"),
  loginId: z.string().trim().min(1, "Required"),
  email: z.string().trim().optional().nullable(),
  mobile: z.string().trim().optional().nullable(),
  password: z.string().min(6, "Min 6 characters"),
  roleIds: z.array(z.string()).optional(),
});
export type CreateUserInput = z.infer<typeof createInput>;

async function assertRolesInOrg(orgId: string, roleIds: string[]) {
  if (!roleIds.length) return;
  const count = await rawDb.role.count({
    where: { id: { in: roleIds }, organizationId: orgId },
  });
  if (count !== roleIds.length) throw new Error("INVALID_ROLE");
}

async function assertUserInOrg(orgId: string, userId: string) {
  const target = await rawDb.user.findFirst({
    where: { id: userId, organizationId: orgId, isSuperAdmin: false },
  });
  if (!target) throw new Error("NOT_FOUND");
  return target;
}

export async function createUser(input: CreateUserInput) {
  const data = createInput.parse(input);
  return withAction({ permission: "user.create" }, async (ctx) => {
    const roleIds = data.roleIds ?? [];
    await assertRolesInOrg(ctx.organizationId, roleIds);
    const existing = await rawDb.user.findUnique({
      where: { loginId: data.loginId },
    });
    if (existing) throw new Error("DUPLICATE_LOGIN");
    const user = await rawDb.user.create({
      data: {
        organizationId: ctx.organizationId,
        fullName: data.fullName,
        loginId: data.loginId,
        email: data.email ?? null,
        mobile: data.mobile ?? null,
        passwordHash: await hashPassword(data.password),
        userRoles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
    });
    await writeAudit({
      action: "create",
      module: "users",
      recordType: "User",
      recordId: user.id,
      newValue: { loginId: user.loginId },
    });
    return user;
  });
}

export async function assignRoles(userId: string, roleIds: string[]) {
  return withAction({ permission: "user.edit" }, async (ctx) => {
    await assertUserInOrg(ctx.organizationId, userId);
    await assertRolesInOrg(ctx.organizationId, roleIds);
    await rawDb.userRole.deleteMany({ where: { userId } });
    await rawDb.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });
    await writeAudit({
      action: "update",
      module: "users",
      recordType: "User",
      recordId: userId,
      newValue: { roleIds },
    });
  });
}

export async function setUserActive(userId: string, active: boolean) {
  return withAction({ permission: "user.deactivate" }, async (ctx) => {
    await assertUserInOrg(ctx.organizationId, userId);
    await rawDb.user.update({
      where: { id: userId },
      data: { isActive: active },
    });
    await writeAudit({
      action: active ? "activate" : "deactivate",
      module: "users",
      recordType: "User",
      recordId: userId,
    });
  });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const pw = z.string().min(6, "Min 6 characters").parse(newPassword);
  return withAction({ permission: "user.edit" }, async (ctx) => {
    await assertUserInOrg(ctx.organizationId, userId);
    await rawDb.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(pw) },
    });
    await writeAudit({
      action: "reset_password",
      module: "users",
      recordType: "User",
      recordId: userId,
    });
  });
}

export async function listUsers() {
  return withAction({ permission: "user.view" }, async (ctx) =>
    rawDb.user.findMany({
      where: { organizationId: ctx.organizationId, isSuperAdmin: false },
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: "desc" },
    }),
  );
}

export async function listOrgRoles() {
  return withAction({ permission: "user.view" }, async (ctx) =>
    rawDb.role.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { name: "asc" },
    }),
  );
}

// --- Form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function createUserForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createUser({
      fullName: (formData.get("fullName") ?? "").toString(),
      loginId: (formData.get("loginId") ?? "").toString(),
      email: (formData.get("email") ?? "").toString() || null,
      mobile: (formData.get("mobile") ?? "").toString() || null,
      password: (formData.get("password") ?? "").toString(),
      roleIds: formData.getAll("roleIds").map((r) => r.toString()),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function resetPasswordAction(userId: string, newPassword: string) {
  await resetUserPassword(userId, newPassword);
}
export async function toggleUserActiveAction(userId: string, active: boolean) {
  await setUserActive(userId, active);
}
