import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

export async function getOrgSettings() {
  return withAction({ permission: "settings.org.manage" }, async (ctx) =>
    rawDb.organization.findUnique({ where: { id: ctx.organizationId } }),
  );
}
