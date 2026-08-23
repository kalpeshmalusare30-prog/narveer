import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { hasPermission } from "./check";
import type { PermissionKey } from "./permissions";
import { runWithTenant } from "@/lib/db/tenant-context";

export type ActionContext = { user: SessionUser; organizationId: string };

/**
 * Gate a tenant-scoped server action: require a session, assert the permission,
 * resolve the organization, and run the body inside the tenant context so the
 * scoped Prisma client injects organizationId automatically.
 */
export async function withAction<T>(
  opts: { permission: PermissionKey; organizationId?: string },
  fn: (ctx: ActionContext) => Promise<T>,
): Promise<T> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!hasPermission(user.permissions, opts.permission)) {
    throw new Error("FORBIDDEN");
  }
  const organizationId = opts.organizationId ?? user.organizationId;
  if (!organizationId) throw new Error("NO_ORG_CONTEXT");
  return runWithTenant(
    { organizationId, userId: user.id, isSuperAdmin: user.isSuperAdmin },
    () => fn({ user, organizationId }),
  );
}

/** Gate a platform-level (super-admin) action against the raw client. */
export async function withSuperAdmin<T>(
  opts: { permission: PermissionKey },
  fn: (user: SessionUser) => Promise<T>,
): Promise<T> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!user.isSuperAdmin) throw new Error("FORBIDDEN");
  if (!hasPermission(user.permissions, opts.permission)) {
    throw new Error("FORBIDDEN");
  }
  return fn(user);
}
