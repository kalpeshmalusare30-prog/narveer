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
      "audit.view",
    ],
  },
  {
    name: "Treasurer",
    description: "Finance-focused access",
    permissions: ["member.view"],
  },
  {
    name: "Committee Member",
    description: "View-only operational access",
    permissions: ["member.view"],
  },
  {
    name: "Data Entry Operator",
    description: "Member data entry",
    permissions: ["member.view", "member.create", "member.edit"],
  },
];

// Super Admin is represented by User.isSuperAdmin and the platform keys org.*
export const SUPER_ADMIN_PERMISSIONS: PermissionKey[] = [
  "org.view",
  "org.create",
  "org.manage",
];
