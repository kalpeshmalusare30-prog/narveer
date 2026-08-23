import { PERMISSIONS, type PermissionKey } from "./permissions";

// Platform-only permissions (Super Admin); never granted to org roles.
const PLATFORM_ONLY: PermissionKey[] = ["org.create", "org.manage"];

// Org Admin gets every org-scoped permission automatically (future-proof).
const ORG_ADMIN_PERMISSIONS: PermissionKey[] = PERMISSIONS.filter(
  (p) => !PLATFORM_ONLY.includes(p),
);

export const SYSTEM_ROLES: {
  name: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
  {
    name: "Org Admin",
    description: "Full access within the organization",
    permissions: ORG_ADMIN_PERMISSIONS,
  },
  {
    name: "Treasurer",
    description: "Finance-focused access",
    permissions: [
      "member.view",
      "financialyear.view",
      "fee.view",
      "fee.assign",
      "fee.waive",
      "payment.view",
      "payment.create",
      "payment.void",
      "receipt.view",
      "income.view",
      "income.create",
      "income.void",
      "expense.view",
      "expense.create",
      "expense.void",
      "settings.income_category.manage",
      "settings.expense_category.manage",
      "report.view",
      "whatsapp.view",
      "whatsapp.send",
      "notification.view",
      "data.import",
    ],
  },
  {
    name: "Committee Member",
    description: "View-only operational access",
    permissions: [
      "member.view",
      "financialyear.view",
      "fee.view",
      "payment.view",
      "receipt.view",
      "income.view",
      "expense.view",
      "report.view",
      "whatsapp.view",
      "notification.view",
    ],
  },
  {
    name: "Data Entry Operator",
    description: "Member and payment data entry",
    permissions: [
      "member.view",
      "member.create",
      "member.edit",
      "fee.view",
      "payment.view",
      "payment.create",
      "receipt.view",
      "whatsapp.view",
      "whatsapp.send",
    ],
  },
];

// Super Admin is represented by User.isSuperAdmin and the platform keys org.*
export const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = [
  "org.view",
  "org.create",
  "org.manage",
];
