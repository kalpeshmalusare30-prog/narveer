"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { PERMISSION_SET, PERMISSIONS } from "@/lib/rbac/permissions";

function validateKeys(keys: string[]) {
  for (const k of keys) {
    if (!PERMISSION_SET.has(k)) throw new Error(`INVALID_PERMISSION: ${k}`);
  }
}

async function ensurePermissionRows() {
  await rawDb.permission.createMany({
    data: PERMISSIONS.map((key) => ({ key })),
    skipDuplicates: true,
  });
}

export async function listRoles() {
  return withAction({ permission: "role.view" }, async () =>
    db.role.findMany({
      include: {
        rolePermissions: true,
        _count: { select: { userRoles: true } },
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  );
}

export async function createRole(
  name: string,
  description: string | null,
  permissionKeys: string[],
) {
  const data = z
    .object({
      name: z.string().trim().min(1, "Required"),
      description: z.string().trim().optional().nullable(),
      permissionKeys: z.array(z.string()),
    })
    .parse({ name, description, permissionKeys });
  validateKeys(data.permissionKeys);
  return withAction({ permission: "role.manage" }, async (ctx) => {
    await ensurePermissionRows();
    const role = await db.role.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        description: data.description ?? null,
        isSystem: false,
      },
    });
    await rawDb.rolePermission.createMany({
      data: data.permissionKeys.map((permissionKey) => ({
        roleId: role.id,
        permissionKey,
      })),
      skipDuplicates: true,
    });
    await writeAudit({
      action: "create",
      module: "roles",
      recordType: "Role",
      recordId: role.id,
      newValue: { name: data.name, permissionKeys: data.permissionKeys },
    });
    return role;
  });
}

export async function updateRolePermissions(
  roleId: string,
  permissionKeys: string[],
) {
  validateKeys(permissionKeys);
  return withAction({ permission: "role.manage" }, async () => {
    const role = await db.role.findFirst({ where: { id: roleId } });
    if (!role) throw new Error("NOT_FOUND");
    await ensurePermissionRows();
    await rawDb.rolePermission.deleteMany({ where: { roleId } });
    await rawDb.rolePermission.createMany({
      data: permissionKeys.map((permissionKey) => ({ roleId, permissionKey })),
      skipDuplicates: true,
    });
    await writeAudit({
      action: "update",
      module: "roles",
      recordType: "Role",
      recordId: roleId,
      newValue: { permissionKeys },
    });
  });
}

export async function deleteRole(roleId: string) {
  return withAction({ permission: "role.manage" }, async () => {
    const role = await db.role.findFirst({ where: { id: roleId } });
    if (!role) throw new Error("NOT_FOUND");
    if (role.isSystem) throw new Error("Cannot delete a system role");
    await db.role.delete({ where: { id: roleId } });
    await writeAudit({
      action: "delete",
      module: "roles",
      recordType: "Role",
      recordId: roleId,
    });
  });
}

// --- Form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function createRoleForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createRole(
      (formData.get("name") ?? "").toString(),
      (formData.get("description") ?? "").toString() || null,
      formData.getAll("permissionKeys").map((p) => p.toString()),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function updateRolePermissionsForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await updateRolePermissions(
      (formData.get("roleId") ?? "").toString(),
      formData.getAll("permissionKeys").map((p) => p.toString()),
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function deleteRoleAction(roleId: string) {
  await deleteRole(roleId);
}
