import { rawDb } from "./raw";
import { getTenant } from "./tenant-context";

// Models with an organizationId column. UserRole/RolePermission are excluded
// (no organizationId; scoped via parent). Prisma 6 extendedWhereUnique (GA)
// permits injecting organizationId into findUnique/update/delete where clauses.
const TENANT_MODELS = new Set([
  "Member",
  "MembershipType",
  "MemberStatus",
  "Role",
  "AuditLog",
]);

const WHERE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
  "update",
  "delete",
  "upsert",
]);

const CREATE_OPS = new Set(["create", "createMany"]);

export const db = rawDb.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_MODELS.has(model)) return query(args);
        const ctx = getTenant();
        if (!ctx) {
          throw new Error(`Tenant context required to access model ${model}`);
        }
        const orgId = ctx.organizationId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = args ?? {};

        if (WHERE_OPS.has(operation)) {
          a.where = { ...(a.where ?? {}), organizationId: orgId };
        }
        if (CREATE_OPS.has(operation)) {
          if (operation === "create") {
            a.data = { ...(a.data ?? {}), organizationId: orgId };
          } else {
            const d = a.data;
            a.data = Array.isArray(d)
              ? d.map((x: Record<string, unknown>) => ({
                  ...x,
                  organizationId: orgId,
                }))
              : { ...d, organizationId: orgId };
          }
        }
        if (operation === "upsert") {
          a.create = { ...(a.create ?? {}), organizationId: orgId };
        }

        return query(a);
      },
    },
  },
});
