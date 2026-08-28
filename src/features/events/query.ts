import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";

export async function listEvents() {
  return withAction({ permission: "event.view" }, async () =>
    db.event.findMany({
      include: { _count: { select: { attendances: true } } },
      orderBy: { eventDate: "desc" },
    }),
  );
}

export async function getEvent(id: string) {
  return withAction({ permission: "event.view" }, async () =>
    db.event.findFirst({
      where: { id },
      include: {
        attendances: {
          include: { member: true },
        },
      },
    }),
  );
}

export async function getEventFormData() {
  return withAction({ permission: "event.manage" }, async () =>
    db.member.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, fullNameEn: true, memberCode: true },
      orderBy: { fullName: "asc" },
    }),
  );
}
