import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Building2,
  Tags,
  ListChecks,
  CreditCard,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  UserCog,
  Shield,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui";

type Item = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  perm: string;
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const perms = me?.permissions ?? [];

  const items: Item[] = [
    { href: "/setup", title: t("settings.organization"), desc: t("setup.title"), icon: Building2, perm: "settings.org.manage" },
    { href: "/settings/membership-types", title: t("settings.membershipTypes"), desc: t("nav.membershipTypes"), icon: Tags, perm: "settings.membership_type.manage" },
    { href: "/settings/member-statuses", title: t("settings.memberStatuses"), desc: t("nav.memberStatuses"), icon: ListChecks, perm: "settings.member_status.manage" },
    { href: "/settings/payment-modes", title: t("settings.paymentModes"), desc: t("nav.paymentModes"), icon: CreditCard, perm: "settings.payment_mode.manage" },
    { href: "/settings/income-categories", title: t("income.title"), desc: t("income.category"), icon: TrendingUp, perm: "settings.income_category.manage" },
    { href: "/settings/expense-categories", title: t("expenses.title"), desc: t("expenses.category"), icon: TrendingDown, perm: "settings.expense_category.manage" },
    { href: "/whatsapp/settings", title: t("whatsapp.settingsTitle"), desc: t("whatsapp.templates"), icon: MessageCircle, perm: "settings.whatsapp.manage" },
    { href: "/users", title: t("settings.users"), desc: t("nav.users"), icon: UserCog, perm: "user.view" },
    { href: "/roles", title: t("settings.roles"), desc: t("nav.roles"), icon: Shield, perm: "role.view" },
  ];
  const visible = items.filter((i) => perms.includes(i.perm));

  return (
    <div>
      <PageHeader title={t("settings.title")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((i) => {
          const Icon = i.icon;
          return (
            <Link
              key={i.href}
              href={i.href}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-800 dark:text-slate-100">
                  {i.title}
                </div>
                <div className="truncate text-sm text-slate-500">{i.desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
