"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  CalendarDays,
  Clock,
  CreditCard,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  HandCoins,
  MessageCircle,
  Radio,
  BarChart3,
  UserCog,
  Shield,
  History,
  Settings,
  Wrench,
  Building2,
  Upload,
  Bell,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  permission?: string;
  superAdmin?: boolean;
};
type NavGroup = { titleKey: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    titleKey: "overview",
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "membersGroup",
    items: [
      { href: "/members", labelKey: "members", icon: Users, permission: "member.view" },
    ],
  },
  {
    titleKey: "finance",
    items: [
      { href: "/finance/years", labelKey: "financeYears", icon: CalendarRange, permission: "financialyear.view" },
      { href: "/finance/pending", labelKey: "pendingDues", icon: Clock, permission: "fee.view" },
      { href: "/payments", labelKey: "payments", icon: CreditCard, permission: "payment.view" },
      { href: "/receipts", labelKey: "receipts", icon: ReceiptText, permission: "receipt.view" },
      { href: "/finance/income", labelKey: "income", icon: TrendingUp, permission: "income.view" },
      { href: "/finance/expenses", labelKey: "expenses", icon: TrendingDown, permission: "expense.view" },
      { href: "/donations", labelKey: "donations", icon: HandCoins, permission: "donation.view" },
    ],
  },
  {
    titleKey: "engagement",
    items: [
      { href: "/events", labelKey: "events", icon: CalendarDays, permission: "event.view" },
    ],
  },
  {
    titleKey: "communication",
    items: [
      { href: "/whatsapp", labelKey: "whatsapp", icon: MessageCircle, permission: "whatsapp.view" },
      { href: "/settings/communication", labelKey: "channels", icon: Radio, permission: "communication.manage" },
    ],
  },
  {
    titleKey: "insights",
    items: [
      { href: "/reports", labelKey: "reports", icon: BarChart3, permission: "report.view" },
    ],
  },
  {
    titleKey: "administration",
    items: [
      { href: "/users", labelKey: "users", icon: UserCog, permission: "user.view" },
      { href: "/roles", labelKey: "roles", icon: Shield, permission: "role.view" },
      { href: "/notifications", labelKey: "notifications", icon: Bell, permission: "notification.view" },
      { href: "/audit", labelKey: "auditLogs", icon: History, permission: "audit.view" },
      { href: "/import", labelKey: "import", icon: Upload, permission: "data.import" },
      { href: "/settings", labelKey: "settings", icon: Settings, permission: "settings.membership_type.manage" },
      { href: "/setup", labelKey: "setup", icon: Wrench, permission: "settings.org.manage" },
      { href: "/organizations", labelKey: "organizations", icon: Building2, superAdmin: true },
    ],
  },
];

export function Nav({
  permissions,
  isSuperAdmin,
  onNavigate,
}: {
  permissions: string[];
  isSuperAdmin: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const visible = (i: NavItem) => {
    if (i.superAdmin) return isSuperAdmin;
    if (i.permission) return permissions.includes(i.permission);
    return true;
  };
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-col gap-5">
      {GROUPS.map((g) => {
        const items = g.items.filter(visible);
        if (!items.length) return null;
        return (
          <div key={g.titleKey}>
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t(g.titleKey)}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((i) => {
                const Icon = i.icon;
                const active = isActive(i.href);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {t(i.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
