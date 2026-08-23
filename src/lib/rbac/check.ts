import { rawDb } from "@/lib/db/raw";
import { SUPER_ADMIN_PERMISSIONS } from "./roles";
import type { PermissionKey } from "./permissions";

export { PERMISSIONS, PERMISSION_SET } from "./permissions";
export type { PermissionKey } from "./permissions";

export function hasPermission(perms: string[], key: PermissionKey): boolean {
  return perms.includes(key);
}

export async function resolveUserPermissions(
  userId: string,
): Promise<string[]> {
  const user = await rawDb.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: { include: { rolePermissions: true } } },
      },
    },
  });
  if (!user) return [];
  if (user.isSuperAdmin) return [...SUPER_ADMIN_PERMISSIONS];
  const set = new Set<string>();
  for (const ur of user.userRoles) {
    for (const rp of ur.role.rolePermissions) set.add(rp.permissionKey);
  }
  return [...set];
}
