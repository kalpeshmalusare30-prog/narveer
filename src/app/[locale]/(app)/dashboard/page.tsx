import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  UserPlus,
  CreditCard,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { db } from "@/lib/db/prisma";
import { getActiveFinancialYear } from "@/features/finance/year-query";
import { getYearCollection } from "@/features/finance/fee-query";
import { getFinancialSummary } from "@/features/finance/money-query";
import { formatINR } from "@/lib/money/money";
import { PageHeader, StatCard, Card } from "@/components/ui";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (user!.isSuperAdmin && !user!.organizationId) {
    redirect({ href: "/organizations", locale });
  }

  const t = await getTranslations("dashboard");
  const tn = await getTranslations();
  const orgId = user!.organizationId!;
  const perms = user!.permissions;

  const [total, active] = await runWithTenant(
    { organizationId: orgId, userId: user!.id },
    async () =>
      Promise.all([
        db.member.count(),
        db.member.count({ where: { isActive: true } }),
      ]),
  );

  const canViewCollection =
    perms.includes("financialyear.view") && perms.includes("fee.view");
  const activeYear = canViewCollection ? await getActiveFinancialYear() : null;
  const collection = activeYear
    ? await getYearCollection(activeYear.id)
    : null;

  const canViewFinance =
    perms.includes("income.view") && perms.includes("expense.view");
  const summary = canViewFinance ? await getFinancialSummary() : null;

  const quickActions = [
    { href: "/members/new", label: tn("members.add"), icon: UserPlus, perm: "member.create" },
    { href: "/payments/new", label: tn("payments.record"), icon: CreditCard, perm: "payment.create" },
    { href: "/finance/income", label: tn("income.add"), icon: TrendingUp, perm: "income.create" },
    { href: "/finance/expenses", label: tn("expenses.add"), icon: TrendingDown, perm: "expense.create" },
    { href: "/whatsapp", label: tn("whatsapp.title"), icon: MessageCircle, perm: "whatsapp.send" },
    { href: "/reports", label: tn("reports.title"), icon: BarChart3, perm: "report.view" },
  ].filter((a) => perms.includes(a.perm));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("welcome", { name: user!.fullName })}
      />

      {/* Members */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("totalMembers")}
          value={total}
          icon={<Users className="h-5 w-5" />}
          tone="indigo"
        />
        <StatCard
          label={t("activeMembers")}
          value={active}
          icon={<UserCheck className="h-5 w-5" />}
          tone="emerald"
        />
        {summary && (
          <>
            <StatCard
              label={tn("reports.totalIncome")}
              value={formatINR(summary.totalIncome)}
              icon={<Wallet className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              label={tn("dashboard.balance")}
              value={formatINR(summary.balance)}
              icon={<PiggyBank className="h-5 w-5" />}
              tone={Number(summary.balance) >= 0 ? "indigo" : "rose"}
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Icon className="h-4 w-4" />
                {a.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Current-year collection */}
      {canViewCollection && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {activeYear
                ? t("collectionTitle", { year: activeYear.label })
                : t("collectionTitle", { year: "—" })}
            </h2>
            {collection && (
              <span className="text-sm font-semibold text-indigo-600">
                {collection.percent}%
              </span>
            )}
          </div>
          {collection ? (
            <>
              <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${Math.min(100, collection.percent)}%` }}
                  data-testid="collection-bar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-slate-500">{t("expected")}</div>
                  <div className="text-lg font-semibold tabular">
                    {formatINR(collection.expected)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">{t("collected")}</div>
                  <div className="text-lg font-semibold tabular text-emerald-600">
                    {formatINR(collection.collected)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    {t("pendingAmount")}
                  </div>
                  <div className="text-lg font-semibold tabular text-rose-600">
                    {formatINR(collection.pending)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    {tn("finance.paidMembers")} / {tn("finance.pendingMembers")}
                  </div>
                  <div className="text-lg font-semibold tabular">
                    {collection.paidMembers} / {collection.pendingMembers}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("noActiveYear")}</p>
          )}
        </Card>
      )}

      {/* Financial summary */}
      {summary && (
        <div>
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
            {tn("reports.incomeExpense")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={tn("dashboard.membershipCollection")}
              value={formatINR(summary.membershipCollection)}
              icon={<Wallet className="h-5 w-5" />}
              tone="indigo"
            />
            <StatCard
              label={tn("dashboard.otherIncome")}
              value={formatINR(summary.otherIncome)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="emerald"
            />
            <StatCard
              label={tn("dashboard.totalExpense")}
              value={formatINR(summary.totalExpense)}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="rose"
            />
            <StatCard
              label={tn("dashboard.balance")}
              value={formatINR(summary.balance)}
              icon={<PiggyBank className="h-5 w-5" />}
              tone={Number(summary.balance) >= 0 ? "indigo" : "rose"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
