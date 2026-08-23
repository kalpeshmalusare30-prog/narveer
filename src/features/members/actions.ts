"use server";

import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { nextMemberCode } from "@/lib/membercode/generate";
import { memberInput, type MemberInput } from "./schema";
import { notify } from "@/lib/notify/notify";

function toDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createMember(input: MemberInput) {
  const data = memberInput.parse(input);
  return withAction({ permission: "member.create" }, async (ctx) => {
    const status = await db.memberStatus.findFirst({
      where: { id: data.statusId },
    });
    if (!status) throw new Error("INVALID_STATUS");
    if (data.membershipTypeId) {
      const mt = await db.membershipType.findFirst({
        where: { id: data.membershipTypeId },
      });
      if (!mt) throw new Error("INVALID_TYPE");
    }
    const memberCode = await nextMemberCode(ctx.organizationId);
    const member = await db.member.create({
      data: {
        organizationId: ctx.organizationId,
        memberCode,
        fullName: data.fullName,
        mobile: data.mobile ?? null,
        whatsappNumber: data.whatsappNumber ?? null,
        alternateMobile: data.alternateMobile ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        area: data.area ?? null,
        dateOfBirth: toDate(data.dateOfBirth),
        joiningDate: toDate(data.joiningDate) ?? new Date(),
        membershipTypeId: data.membershipTypeId || null,
        statusId: data.statusId,
        notes: data.notes ?? null,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "create",
      module: "members",
      recordType: "Member",
      recordId: member.id,
      newValue: { fullName: member.fullName, memberCode },
    });
    await notify("member", `New member added: ${member.fullName} (${memberCode})`);
    return member;
  });
}

export async function updateMember(id: string, input: MemberInput) {
  const data = memberInput.parse(input);
  return withAction({ permission: "member.edit" }, async (ctx) => {
    const existing = await db.member.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    const updated = await db.member.update({
      where: { id },
      data: {
        fullName: data.fullName,
        mobile: data.mobile ?? null,
        whatsappNumber: data.whatsappNumber ?? null,
        alternateMobile: data.alternateMobile ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        area: data.area ?? null,
        dateOfBirth: toDate(data.dateOfBirth),
        joiningDate: toDate(data.joiningDate) ?? existing.joiningDate,
        membershipTypeId: data.membershipTypeId || null,
        statusId: data.statusId,
        notes: data.notes ?? null,
        updatedBy: ctx.user.id,
      },
    });
    await writeAudit({
      action: "update",
      module: "members",
      recordType: "Member",
      recordId: id,
      oldValue: { fullName: existing.fullName, mobile: existing.mobile },
      newValue: { fullName: updated.fullName, mobile: updated.mobile },
    });
    return updated;
  });
}

export async function voidMember(id: string) {
  return withAction({ permission: "member.void" }, async () => {
    const existing = await db.member.findFirst({ where: { id } });
    if (!existing) throw new Error("NOT_FOUND");
    await db.member.update({ where: { id }, data: { isActive: false } });
    await writeAudit({
      action: "void",
      module: "members",
      recordType: "Member",
      recordId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    });
  });
}

// --- Form adapters (called from client forms) ---

export type SaveState = { error?: string; success?: boolean };

function str(fd: FormData, key: string): string {
  return (fd.get(key) ?? "").toString();
}
function opt(fd: FormData, key: string): string | null {
  const v = str(fd, key).trim();
  return v === "" ? null : v;
}

export async function saveMemberForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const id = opt(formData, "id");
  const input: MemberInput = {
    fullName: str(formData, "fullName"),
    mobile: opt(formData, "mobile"),
    whatsappNumber: opt(formData, "whatsappNumber"),
    alternateMobile: opt(formData, "alternateMobile"),
    email: opt(formData, "email"),
    address: opt(formData, "address"),
    area: opt(formData, "area"),
    dateOfBirth: opt(formData, "dateOfBirth"),
    joiningDate: opt(formData, "joiningDate"),
    membershipTypeId: opt(formData, "membershipTypeId"),
    statusId: str(formData, "statusId"),
    notes: opt(formData, "notes"),
  };
  try {
    if (id) await updateMember(id, input);
    else await createMember(input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function voidMemberAction(id: string): Promise<void> {
  await voidMember(id);
}
