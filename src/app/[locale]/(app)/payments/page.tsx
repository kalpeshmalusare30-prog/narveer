import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/session";
import { listPayments } from "@/features/payments/query";
import { Link } from "@/i18n/navigation";
import { PageHeader, Button, Badge } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { VoidPaymentButton } from "@/features/payments/components/VoidPaymentButton";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canCreate = !!me?.permissions.includes("payment.create");
  const canVoid = !!me?.permissions.includes("payment.void");
  const payments = await listPayments();

  return (
    <div>
      <PageHeader
        title={t("payments.title")}
        actions={
          canCreate ? (
            <Link href="/payments/new">
              <Button>{t("payments.record")}</Button>
            </Link>
          ) : null
        }
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("payments.date")}</th>
              <th className="px-4 py-2">{t("payments.member")}</th>
              <th className="px-4 py-2">{t("payments.amount")}</th>
              <th className="px-4 py-2">{t("payments.mode")}</th>
              <th className="px-4 py-2">{t("payments.receiptNo")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2">
                  {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/members/${p.memberId}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {p.member.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  {formatINR(p.amount.toString())}
                  {p.isVoided && (
                    <Badge tone="red">{t("payments.voided")}</Badge>
                  )}
                </td>
                <td className="px-4 py-2">{p.paymentMode.name}</td>
                <td className="px-4 py-2">
                  {p.receipt ? (
                    <a
                      href={`${locale === "en" ? "" : `/${locale}`}/receipts/${p.receipt.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 hover:underline"
                    >
                      {p.receipt.receiptNumber}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  {canVoid && !p.isVoided && <VoidPaymentButton id={p.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
