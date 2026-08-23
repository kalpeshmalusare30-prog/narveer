import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function getRole(id: string) {
  return withAction({ permission: "role.view" }, async () =>
    db.role.findFirst({ where: { id }, include: { rolePermissions: true } }),
  );
}
