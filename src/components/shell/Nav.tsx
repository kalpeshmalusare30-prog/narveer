"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type NavItem = {
  href: string;
  labelKey: string;
  permission?: string;
  superAdmin?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/members", labelKey: "members", permission: "member.view" },
  {
    href: "/finance/years",
    labelKey: "financeYears",
    permission: "financialyear.view",
  },
  { href: "/payments", labelKey: "payments", permission: "payment.view" },
  {
    href: "/finance/pending",
    labelKey: "pendingDues",
    permission: "fee.view",
  },
  { href: "/receipts", labelKey: "receipts", permission: "receipt.view" },
  {
    href: "/settings/membership-types",
    labelKey: "membershipTypes",
    permission: "settings.membership_type.manage",
  },
  {
    href: "/settings/member-statuses",
    labelKey: "memberStatuses",
    permission: "settings.member_status.manage",
  },
  {
    href: "/settings/payment-modes",
    labelKey: "paymentModes",
    permission: "settings.payment_mode.manage",
  },
  { href: "/users", labelKey: "users", permission: "user.view" },
  { href: "/roles", labelKey: "roles", permission: "role.view" },
  { href: "/setup", labelKey: "setup", permission: "settings.org.manage" },
  { href: "/organizations", labelKey: "organizations", superAdmin: true },
];

export function Nav({
  permissions,
  isSuperAdmin,
}: {
  permissions: string[];
  isSuperAdmin: boolean;
}) {
  const t = useTranslations("nav");
  const items = NAV_ITEMS.filter((i) => {
    if (i.superAdmin) return isSuperAdmin;
    if (i.permission) return permissions.includes(i.permission);
    return true;
  });

  return (
    <nav className="flex flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {t(i.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
