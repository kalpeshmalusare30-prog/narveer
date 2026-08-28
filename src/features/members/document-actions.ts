"use server";

import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { revalidatePath } from "next/cache";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export type SaveState = { error?: string; success?: boolean };

async function fileToDataUri(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  return `data:${file.type || "application/octet-stream"};base64,${buf.toString("base64")}`;
}

export async function uploadMemberDocument(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const memberId = (formData.get("memberId") ?? "").toString();
  const file = formData.get("file");
  if (!memberId || !(file instanceof File) || file.size === 0) {
    return { error: "INVALID_INPUT" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "documents.tooLarge" };
  }
  try {
    await withAction({ permission: "document.manage" }, async (ctx) => {
      const member = await db.member.findFirst({ where: { id: memberId } });
      if (!member) throw new Error("NOT_FOUND");
      const dataUri = await fileToDataUri(file);
      const doc = await db.memberDocument.create({
        data: {
          organizationId: ctx.organizationId,
          memberId,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          dataUri,
          uploadedBy: ctx.user.id,
        },
      });
      await writeAudit({
        action: "create",
        module: "members",
        recordType: "MemberDocument",
        recordId: doc.id,
        newValue: { name: doc.name, memberId },
      });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function deleteMemberDocument(id: string): Promise<void> {
  return withAction({ permission: "document.manage" }, async (ctx) => {
    const doc = await db.memberDocument.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!doc) throw new Error("NOT_FOUND");
    await db.memberDocument.delete({ where: { id } });
    await writeAudit({
      action: "delete",
      module: "members",
      recordType: "MemberDocument",
      recordId: id,
      oldValue: { name: doc.name, memberId: doc.memberId },
    });
    revalidatePath(`/members/${doc.memberId}`);
  });
}

export async function setMemberPhoto(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const memberId = (formData.get("memberId") ?? "").toString();
  const file = formData.get("file");
  if (!memberId || !(file instanceof File) || file.size === 0) {
    return { error: "INVALID_INPUT" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "documents.tooLarge" };
  }
  try {
    await withAction({ permission: "member.edit" }, async (ctx) => {
      const member = await db.member.findFirst({ where: { id: memberId } });
      if (!member) throw new Error("NOT_FOUND");
      const dataUri = await fileToDataUri(file);
      await db.member.update({
        where: { id: memberId },
        data: { photoDataUri: dataUri, updatedBy: ctx.user.id },
      });
      await writeAudit({
        action: "update",
        module: "members",
        recordType: "Member",
        recordId: memberId,
        newValue: { photoUpdated: true },
      });
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}

export async function addMemberRelation(
  memberId: string,
  relatedMemberId: string,
  relationType: string,
): Promise<void> {
  return withAction({ permission: "member.edit" }, async (ctx) => {
    if (memberId === relatedMemberId) throw new Error("INVALID_RELATION");
    const [member, related] = await Promise.all([
      db.member.findFirst({ where: { id: memberId } }),
      db.member.findFirst({ where: { id: relatedMemberId } }),
    ]);
    if (!member || !related) throw new Error("NOT_FOUND");
    const existing = await db.memberRelation.findFirst({
      where: {
        memberId,
        relatedMemberId,
        relationType,
        organizationId: ctx.organizationId,
      },
    });
    if (existing) throw new Error("DUPLICATE_RELATION");
    const rel = await db.memberRelation.create({
      data: {
        organizationId: ctx.organizationId,
        memberId,
        relatedMemberId,
        relationType,
      },
    });
    await writeAudit({
      action: "create",
      module: "members",
      recordType: "MemberRelation",
      recordId: rel.id,
      newValue: { memberId, relatedMemberId, relationType },
    });
    revalidatePath(`/members/${memberId}`);
  });
}

export async function removeMemberRelation(id: string): Promise<void> {
  return withAction({ permission: "member.edit" }, async (ctx) => {
    const rel = await db.memberRelation.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });
    if (!rel) throw new Error("NOT_FOUND");
    await db.memberRelation.delete({ where: { id } });
    await writeAudit({
      action: "delete",
      module: "members",
      recordType: "MemberRelation",
      recordId: id,
      oldValue: {
        memberId: rel.memberId,
        relatedMemberId: rel.relatedMemberId,
      },
    });
    revalidatePath(`/members/${rel.memberId}`);
  });
}
