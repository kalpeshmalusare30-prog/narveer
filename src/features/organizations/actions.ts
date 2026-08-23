"use server";

import { z } from "zod";
import { rawDb } from "@/lib/db/raw";
import { withSuperAdmin } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { SYSTEM_ROLES } from "@/lib/rbac/roles";
import { PERMISSIONS } from "@/lib/rbac/permissions";

const orgInput = z.object({
  name: z.string().trim().min(1, "Required"),
  shortName: z.string().trim().min(1, "Required"),
  city: z.string().trim().optional().nullable(),
  contactNumber: z.string().trim().optional().nullable(),
  email: z.string().trim().optional().nullable(),
});
export type OrgInput = z.infer<typeof orgInput>;

export async function createOrganization(input: OrgInput) {
  const data = orgInput.parse(input);
  return withSuperAdmin({ permission: "org.create" }, async (user) => {
    await rawDb.permission.createMany({
      data: PERMISSIONS.map((key) => ({ key })),
      skipDuplicates: true,
    });
    const org = await rawDb.organization.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        city: data.city ?? null,
        contactNumber: data.contactNumber ?? null,
        email: data.email ?? null,
      },
    });
    for (const r of SYSTEM_ROLES) {
      const role = await rawDb.role.create({
        data: {
          organizationId: org.id,
          name: r.name,
          description: r.description,
          isSystem: true,
        },
      });
      await rawDb.rolePermission.createMany({
        data: r.permissions.map((permissionKey) => ({
          roleId: role.id,
          permissionKey,
        })),
        skipDuplicates: true,
      });
    }
    await rawDb.membershipType.create({
      data: { organizationId: org.id, name: "General" },
    });
    for (const s of [
      { name: "Active", isTerminal: false },
      { name: "Inactive", isTerminal: false },
      { name: "Left Organization", isTerminal: true },
    ]) {
      await rawDb.memberStatus.create({
        data: {
          organizationId: org.id,
          name: s.name,
          isTerminal: s.isTerminal,
        },
      });
    }
    await writeAudit({
      action: "create",
      module: "organizations",
      recordType: "Organization",
      recordId: org.id,
      userId: user.id,
      organizationId: org.id,
      newValue: { name: org.name },
    });
    return org;
  });
}

export async function setOrganizationActive(id: string, active: boolean) {
  return withSuperAdmin({ permission: "org.manage" }, async (user) => {
    await rawDb.organization.update({
      where: { id },
      data: { isActive: active },
    });
    await writeAudit({
      action: active ? "activate" : "deactivate",
      module: "organizations",
      recordType: "Organization",
      recordId: id,
      userId: user.id,
      organizationId: id,
    });
  });
}

export async function listOrganizations() {
  return withSuperAdmin({ permission: "org.view" }, async () =>
    rawDb.organization.findMany({ orderBy: { createdAt: "desc" } }),
  );
}

// --- Form adapters ---
export type SaveState = { error?: string; success?: boolean };

export async function createOrgForm(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  try {
    await createOrganization({
      name: (formData.get("name") ?? "").toString(),
      shortName: (formData.get("shortName") ?? "").toString(),
      city: (formData.get("city") ?? "").toString() || null,
      contactNumber: (formData.get("contactNumber") ?? "").toString() || null,
      email: (formData.get("email") ?? "").toString() || null,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  return { success: true };
}

export async function toggleOrgActiveAction(id: string, active: boolean) {
  await setOrganizationActive(id, active);
}
