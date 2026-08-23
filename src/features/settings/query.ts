import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listMembershipTypes() {
  return withAction(
    { permission: "settings.membership_type.manage" },
    async () => db.membershipType.findMany({ orderBy: { name: "asc" } }),
  );
}

export async function listMemberStatuses() {
  return withAction({ permission: "settings.member_status.manage" }, async () =>
    db.memberStatus.findMany({ orderBy: { name: "asc" } }),
  );
}
