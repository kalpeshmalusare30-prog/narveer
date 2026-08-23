import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/session";
import { listFinancialYears } from "@/features/finance/year-query";
import { Link } from "@/i18n/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { FinancialYearForm } from "@/features/finance/components/FinancialYearForm";
import { YearActionButtons } from "@/features/finance/components/YearActionButtons";

export default async function FinancialYearsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canManage = !!me?.permissions.includes("financialyear.manage");
  const years = await listFinancialYears();

  return (
    <div>
      <PageHeader title={t("finance.yearsTitle")} />
      {canManage && <FinancialYearForm />}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("finance.label")}</th>
              <th className="px-4 py-2">{t("finance.feeAmount")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              {canManage && (
                <th className="px-4 py-2">{t("common.actions")}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr
                key={y.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">
                  <Link
                    href={`/finance/years/${y.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {y.label}
                  </Link>
                </td>
                <td className="px-4 py-2">{formatINR(y.feeAmount.toString())}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <Badge tone={y.isActive ? "green" : "slate"}>
                      {y.isActive ? t("finance.active") : t("common.inactive")}
                    </Badge>
                    {y.isClosed && (
                      <Badge tone="red">{t("finance.closed")}</Badge>
                    )}
                  </div>
                </td>
                {canManage && (
                  <td className="px-4 py-2">
                    <YearActionButtons
                      id={y.id}
                      isActive={y.isActive}
                      isClosed={y.isClosed}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
