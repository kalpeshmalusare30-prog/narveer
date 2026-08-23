"use server";

import { z } from "zod";
import { rawDb } from "@/lib/db/raw";
import { withSuperAdmin } from "@/lib/rbac/guard";
import { writeAudit } from "@/lib/audit/audit";
import { provisionOrgDefaults } from "@/lib/org/provision";

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
    const org = await rawDb.organization.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        city: data.city ?? null,
        contactNumber: data.contactNumber ?? null,
        email: data.email ?? null,
      },
    });
    // Seed all per-org defaults (roles, categories, templates) — shared with seed.
    await provisionOrgDefaults(rawDb, org.id);
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
