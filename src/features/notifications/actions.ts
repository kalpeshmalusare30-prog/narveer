"use server";

import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function markAllNotificationsRead() {
  return withAction({ permission: "notification.view" }, async () => {
    await db.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  });
}

export async function markAllReadAction() {
  await markAllNotificationsRead();
}
