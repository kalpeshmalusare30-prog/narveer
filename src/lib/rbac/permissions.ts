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
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);
