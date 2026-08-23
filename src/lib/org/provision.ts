import type { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "../rbac/permissions";
import { SYSTEM_ROLES } from "../rbac/roles";

export const DEFAULT_MEMBERSHIP_TYPES = ["General", "Life", "Honorary"];
export const DEFAULT_MEMBER_STATUSES = [
  { name: "Active", isTerminal: false },
  { name: "Inactive", isTerminal: false },
  { name: "Suspended", isTerminal: false },
  { name: "Left Organization", isTerminal: true },
];
export const DEFAULT_PAYMENT_MODES = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Cheque",
  "Other",
];
export const DEFAULT_INCOME_CATEGORIES = [
  "Donation",
  "Event Income",
  "Sponsorship",
  "Other Income",
];
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Event / Program",
  "Office",
  "Maintenance",
  "Electricity",
  "Water",
  "Advertising",
  "Materials",
  "Services",
  "Travel",
  "Other",
];
export const DEFAULT_WHATSAPP_TEMPLATES = [
  {
    type: "reminder",
    name: "Pending Reminder",
    body: "नमस्कार {{memberName}},\n\nआपल्या {{financialYear}} या वर्षाची सभासद वर्गणी ₹{{pendingAmount}} बाकी आहे.\nएकूण थकबाकी: ₹{{totalPending}}.\n\nकृपया आपली वर्गणी लवकरात लवकर जमा करावी.\n\nधन्यवाद.\n{{organizationName}}",
  },
  {
    type: "confirmation",
    name: "Payment Confirmation",
    body: "नमस्कार {{memberName}},\n\nआपली {{financialYear}} या वर्षाची सभासद वर्गणी ₹{{amount}} जमा झाली आहे. पावती क्र: {{receiptNumber}}.\n\nआपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद. 🙏\n{{organizationName}}",
  },
  {
    type: "thankyou",
    name: "Thank You",
    body: "नमस्कार {{memberName}},\n\nआपल्या सहकार्याबद्दल {{organizationName}} तर्फे मनःपूर्वक धन्यवाद. 🙏",
  },
  {
    type: "receipt",
    name: "Receipt Sharing",
    body: "नमस्कार {{memberName}},\n\nआपली पावती क्र {{receiptNumber}} ({{amount}}) तयार झाली आहे.\n\nधन्यवाद.\n{{organizationName}}",
  },
];

/**
 * Seed all per-organization defaults idempotently: the permission catalog,
 * system roles + their permission mappings, membership types, member statuses,
 * payment modes, income/expense categories, and WhatsApp templates. Shared by
 * the seed script and by super-admin organization creation so the two never
 * drift. Returns a map of system role name -> role id.
 */
export async function provisionOrgDefaults(
  client: PrismaClient,
  orgId: string,
): Promise<Record<string, string>> {
  await client.permission.createMany({
    data: PERMISSIONS.map((key) => ({ key })),
    skipDuplicates: true,
  });

  const roleByName: Record<string, string> = {};
  for (const r of SYSTEM_ROLES) {
    const role = await client.role.upsert({
      where: { organizationId_name: { organizationId: orgId, name: r.name } },
      update: { description: r.description, isSystem: true },
      create: {
        organizationId: orgId,
        name: r.name,
        description: r.description,
        isSystem: true,
      },
    });
    roleByName[r.name] = role.id;
    await client.rolePermission.deleteMany({ where: { roleId: role.id } });
    await client.rolePermission.createMany({
      data: r.permissions.map((permissionKey) => ({
        roleId: role.id,
        permissionKey,
      })),
      skipDuplicates: true,
    });
  }

  for (const name of DEFAULT_MEMBERSHIP_TYPES) {
    await client.membershipType.upsert({
      where: { organizationId_name: { organizationId: orgId, name } },
      update: {},
      create: { organizationId: orgId, name },
    });
  }
  for (const s of DEFAULT_MEMBER_STATUSES) {
    await client.memberStatus.upsert({
      where: { organizationId_name: { organizationId: orgId, name: s.name } },
      update: {},
      create: { organizationId: orgId, name: s.name, isTerminal: s.isTerminal },
    });
  }
  for (const name of DEFAULT_PAYMENT_MODES) {
    await client.paymentMode.upsert({
      where: { organizationId_name: { organizationId: orgId, name } },
      update: {},
      create: { organizationId: orgId, name },
    });
  }
  for (const name of DEFAULT_INCOME_CATEGORIES) {
    await client.incomeCategory.upsert({
      where: { organizationId_name: { organizationId: orgId, name } },
      update: {},
      create: { organizationId: orgId, name },
    });
  }
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await client.expenseCategory.upsert({
      where: { organizationId_name: { organizationId: orgId, name } },
      update: {},
      create: { organizationId: orgId, name },
    });
  }
  for (const tpl of DEFAULT_WHATSAPP_TEMPLATES) {
    await client.whatsAppTemplate.upsert({
      where: {
        organizationId_type_name: {
          organizationId: orgId,
          type: tpl.type,
          name: tpl.name,
        },
      },
      update: {},
      create: { organizationId: orgId, ...tpl },
    });
  }

  return roleByName;
}
