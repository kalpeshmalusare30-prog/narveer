import { db } from "@/lib/db/prisma";
import { rawDb } from "@/lib/db/raw";
import { withAction } from "@/lib/rbac/guard";

export async function listAuditLogs() {
  return withAction({ permission: "audit.view" }, async () => {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    const ids = [
      ...new Set(logs.map((l) => l.userId).filter(Boolean)),
    ] as string[];
    const users = ids.length
      ? await rawDb.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, fullName: true },
        })
      : [];
    const nameById = Object.fromEntries(users.map((u) => [u.id, u.fullName]));
    return logs.map((l) => ({
      id: l.id,
      createdAt: l.createdAt,
      userName: l.userId ? (nameById[l.userId] ?? l.userId) : "—",
      module: l.module,
      action: l.action,
      recordType: l.recordType,
      recordId: l.recordId,
      oldValue: l.oldValue,
      newValue: l.newValue,
    }));
  });
}
