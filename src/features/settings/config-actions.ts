"use server";

import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { withAction } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";

const nameInput = z.object({ name: z.string().trim().min(1, "Required") });

export async function createMembershipType(name: string) {
  const data = nameInput.parse({ name });
  return withAction(
    { permission: "settings.membership_type.manage" },
    async (ctx) => {
      const existing = await db.membershipType.findFirst({
        where: { name: data.name },
      });
      if (existing) throw new Error("DUPLICATE");
      const created = await db.membershipType.create({
        data: { organizationId: ctx.organizationId, name: data.name },
      });
      await writeAudit({
        action: "create",
        module: "settings",
        recordType: "MembershipType",
        recordId: created.id,
        newValue: { name: data.name },
      });
      return created;
    },
  );
}

export async function setMembershipTypeActive(id: string, active: boolean) {
  return withAction(
    { permission: "settings.membership_type.manage" },
    async () => {
      await db.membershipType.update({
        where: { id },
        data: { isActive: active },
      });
      await writeAudit({
        action: "update",
        module: "settings",
        recordType: "MembershipType",
        recordId: id,
        newValue: { isActive: active },
      });
    },
  );
}

export async function createMemberStatus(name: string, isTerminal: boolean) {
  const data = nameInput.parse({ name });
  return withAction(
    { permission: "settings.member_status.manage" },
    async (ctx) => {
      const existing = await db.memberStatus.findFirst({
        where: { name: data.name },
      });
      if (existing) throw new Error("DUPLICATE");
      const created = await db.memberStatus.create({
        data: { organizationId: ctx.organizationId, name: data.name, isTerminal },
      });
      await writeAudit({
        action: "create",
        module: "settings",
        recordType: "MemberStatus",
        recordId: created.id,
        newValue: { name: data.name, isTerminal },
      });
      return created;
    },
  );
}

export async function setMemberStatusActive(id: string, active: boolean) {
  return withAction({ permission: "settings.member_status.manage" }, async () => {
    await db.memberStatus.update({ where: { id }, data: { isActive: active } });
    await writeAudit({
      action: "update",
      module: "settings",
      recordType: "MemberStatus",
      recordId: id,
      newValue: { isActive: active },
    });
  });
}

// --- Form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function createMembershipTypeForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createMembershipType((formData.get("name") ?? "").toString());
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function createMemberStatusForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createMemberStatus(
      (formData.get("name") ?? "").toString(),
      formData.get("isTerminal") === "on",
    );
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function toggleMembershipTypeAction(id: string, active: boolean) {
  await setMembershipTypeActive(id, active);
}
export async function toggleMemberStatusAction(id: string, active: boolean) {
  await setMemberStatusActive(id, active);
}
