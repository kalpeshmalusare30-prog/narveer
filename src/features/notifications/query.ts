import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listNotifications() {
  return withAction({ permission: "notification.view" }, async () =>
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  );
}

export async function unreadNotificationCount() {
  return withAction({ permission: "notification.view" }, async () =>
    db.notification.count({ where: { isRead: false } }),
  );
}
