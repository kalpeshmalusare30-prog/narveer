import type { PermissionKey } from "./permissions";

export const SYSTEM_ROLES: {
  name: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
  {
    name: "Org Admin",
    description: "Full access within the organization",
    permissions: [
      "org.view",
      "member.view",
      "member.create",
      "member.edit",
      "member.void",
      "user.view",
      "user.create",
      "user.edit",
      "user.deactivate",
      "role.view",
      "role.manage",
      "settings.org.manage",
      "settings.membership_type.manage",
      "settings.member_status.manage",
      "settings.payment_mode.manage",
      "audit.view",
      "financialyear.view",
      "financialyear.manage",
      "fee.view",
      "fee.assign",
      "fee.waive",
      "payment.view",
      "payment.create",
      "payment.void",
      "receipt.view",
    ],
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
    ],
  },
  {
    name: "Data Entry Operator",
    description: "Member data entry",
    permissions: [
      "member.view",
      "member.create",
      "member.edit",
      "fee.view",
      "payment.view",
      "payment.create",
      "receipt.view",
    ],
  },
];

// Super Admin is represented by User.isSuperAdmin and the platform keys org.*
export const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = [
  "org.view",
  "org.create",
  "org.manage",
];
