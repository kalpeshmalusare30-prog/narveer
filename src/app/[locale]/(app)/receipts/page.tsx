import { setRequestLocale, getTranslations } from "next-intl/server";
import { listReceipts } from "@/features/receipts/query";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui";
import { formatINR } from "@/lib/money/money";

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const receipts = await listReceipts();
  const pfx = locale === "en" ? "" : `/${locale}`;

  return (
    <div>
      <PageHeader title={t("receipts.title")} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("receipts.receiptNo")}</th>
              <th className="px-4 py-2">{t("receipts.date")}</th>
              <th className="px-4 py-2">{t("receipts.member")}</th>
              <th className="px-4 py-2">{t("receipts.amount")}</th>
              <th className="px-4 py-2">{t("receipts.mode")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-mono">{r.receiptNumber}</td>
                <td className="px-4 py-2">
                  {new Date(r.receiptDate).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/members/${r.memberId}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {r.member.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {formatINR(r.payment.amount.toString())}
                </td>
                <td className="px-4 py-2">{r.payment.paymentMode.name}</td>
                <td className="px-4 py-2">
                  <a
                    href={`${pfx}/receipts/${r.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    {t("receipts.downloadPdf")}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
