"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const eventSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["Event", "Meeting"]),
  eventDate: z.string().min(1),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type EventInput = z.infer<typeof eventSchema>;

export async function createEventRecord(input: EventInput) {
  const data = eventSchema.parse(input);
  return withAction({ permission: "event.manage" }, async (ctx) => {
    const event = await db.event.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        type: data.type,
        eventDate: new Date(data.eventDate),
        location: data.location ?? null,
        description: data.description ?? null,
        createdBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "create",
      module: "events",
      recordType: "Event",
      recordId: event.id,
      newValue: { title: event.title, type: event.type },
    });
    revalidatePath("/events");
    return event;
  });
}

export async function cancelEvent(id: string) {
  return withAction({ permission: "event.manage" }, async () => {
    const existing = await db.event.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    await db.event.update({ where: { id }, data: { isCancelled: true } });
    await writeAudit({
      action: "cancel",
      module: "events",
      recordType: "Event",
      recordId: id,
      oldValue: { isCancelled: false },
      newValue: { isCancelled: true },
    });
    revalidatePath("/events");
    revalidatePath(`/events/${id}`);
  });
}

export async function setAttendance(
  eventId: string,
  memberId: string,
  status: "Present" | "Absent" | "Excused",
) {
  return withAction({ permission: "event.manage" }, async (ctx) => {
    const event = await db.event.findFirst({ where: { id: eventId } });
    if (!event) throw new Error("NOT_FOUND");
    const member = await db.member.findFirst({ where: { id: memberId } });
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    const attendance = await db.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      update: { status },
      create: {
        organizationId: ctx.organizationId,
        eventId,
        memberId,
        status,
      },
    });
    await writeAudit({
      action: "update",
      module: "events",
      recordType: "EventAttendance",
      recordId: attendance.id,
      newValue: { eventId, memberId, status },
    });
    revalidatePath(`/events/${eventId}`);
    return attendance;
  });
}

// --- Form adapters (called from client forms via useActionState) ---

export type SaveState = { error?: string; success?: boolean; id?: string };

function str(fd: FormData, key: string): string {
  return (fd.get(key) ?? "").toString();
}
function opt(fd: FormData, key: string): string | null {
  const v = str(fd, key).trim();
  return v === "" ? null : v;
}

export async function createEvent(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireUser();
  try {
    const event = await createEventRecord({
      title: str(formData, "title"),
      type: str(formData, "type") === "Meeting" ? "Meeting" : "Event",
      eventDate: str(formData, "eventDate"),
      location: opt(formData, "location"),
      description: opt(formData, "description"),
    });
    return { success: true, id: event.id };
  } catch {
    return { error: "createFailed" };
  }
}

export async function cancelEventAction(id: string): Promise<void> {
  await cancelEvent(id);
}

export async function setAttendanceAction(
  eventId: string,
  memberId: string,
  status: "Present" | "Absent" | "Excused",
): Promise<void> {
  await setAttendance(eventId, memberId, status);
}
