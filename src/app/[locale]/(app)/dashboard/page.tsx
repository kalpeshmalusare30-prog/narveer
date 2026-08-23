import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { db } from "@/lib/db/prisma";
import { getActiveFinancialYear } from "@/features/finance/year-query";
import { getYearCollection } from "@/features/finance/fee-query";
import { formatINR } from "@/lib/money/money";
import { PageHeader, Card } from "@/components/ui";

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
  const orgId = user!.organizationId!;
  const [total, active] = await runWithTenant(
    { organizationId: orgId, userId: user!.id },
    async () =>
      Promise.all([
        db.member.count(),
        db.member.count({ where: { isActive: true } }),
      ]),
  );

  const canViewCollection =
    user!.permissions.includes("financialyear.view") &&
    user!.permissions.includes("fee.view");
  const activeYear = canViewCollection ? await getActiveFinancialYear() : null;
  const collection = activeYear
    ? await getYearCollection(activeYear.id)
    : null;

  return (
    <div>
      <PageHeader title={t("title")} />
      <p className="mb-6 text-sm text-slate-500">
        {t("welcome", { name: user!.fullName })}
      </p>
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <Card>
          <div className="text-sm text-slate-500">{t("totalMembers")}</div>
          <div className="mt-1 text-3xl font-bold" data-testid="stat-total">
            {total}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">{t("activeMembers")}</div>
          <div className="mt-1 text-3xl font-bold" data-testid="stat-active">
            {active}
          </div>
        </Card>
      </div>

      {canViewCollection && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">
            {activeYear
              ? t("collectionTitle", { year: activeYear.label })
              : t("collectionTitle", { year: "—" })}
          </h2>
          {collection ? (
            <div className="grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <div className="text-sm text-slate-500">{t("expected")}</div>
                <div className="mt-1 text-2xl font-bold">
                  {formatINR(collection.expected)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-slate-500">{t("collected")}</div>
                <div className="mt-1 text-2xl font-bold text-green-700">
                  {formatINR(collection.collected)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-slate-500">
                  {t("pendingAmount")}
                </div>
                <div className="mt-1 text-2xl font-bold text-red-600">
                  {formatINR(collection.pending)}
                </div>
              </Card>
              <Card>
                <div className="text-sm text-slate-500">
                  {t("collectionPercent")}
                </div>
                <div
                  className="mt-1 text-2xl font-bold"
                  data-testid="collection-percent"
                >
                  {collection.percent}%
                </div>
              </Card>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("noActiveYear")}</p>
          )}
        </div>
      )}
    </div>
  );
}
