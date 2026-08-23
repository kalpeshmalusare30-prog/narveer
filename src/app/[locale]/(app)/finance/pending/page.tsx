import { setRequestLocale, getTranslations } from "next-intl/server";
import { listPendingDues } from "@/features/finance/fee-query";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui";
import { formatINR } from "@/lib/money/money";

export default async function PendingDuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const rows = await listPendingDues();

  return (
    <div>
      <PageHeader title={t("finance.pendingDuesTitle")} />
      {rows.length === 0 ? (
        <p className="text-slate-500" data-testid="no-pending">
          {t("finance.noPending")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
              <tr>
                <th className="px-4 py-2">{t("members.memberCode")}</th>
                <th className="px-4 py-2">{t("members.fullName")}</th>
                <th className="px-4 py-2">{t("members.mobile")}</th>
                <th className="px-4 py-2">{t("finance.pendingYears")}</th>
                <th className="px-4 py-2">{t("finance.totalPending")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.memberId}
                  className="border-t border-slate-100 dark:border-slate-700"
                >
                  <td className="px-4 py-2 font-mono">{r.memberCode}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/members/${r.memberId}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {r.memberName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.mobile}</td>
                  <td className="px-4 py-2">{r.pendingYears}</td>
                  <td className="px-4 py-2 font-semibold text-red-600">
                    {formatINR(r.totalPending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
