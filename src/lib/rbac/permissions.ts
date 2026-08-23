export const PERMISSIONS = [
  "org.view",
  "org.create",
  "org.manage",
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
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);
