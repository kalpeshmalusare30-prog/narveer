import { setRequestLocale, getTranslations } from "next-intl/server";
import { ReceiptText, Download } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listReceipts } from "@/features/receipts/query";
import { Link } from "@/i18n/navigation";
import {
  PageHeader,
  Table,
  THead,
  TR,
  TH,
  TD,
  EmptyState,
} from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { WaSendButton } from "@/features/whatsapp/components/WaSendButton";

export default async function ReceiptsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canSend = !!me?.permissions.includes("whatsapp.send");
  const receipts = await listReceipts();
  const pfx = locale === "en" ? "" : `/${locale}`;

  return (
    <div>
      <PageHeader title={t("receipts.title")} />
      {receipts.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-6 w-6" />}
          title={t("receipts.title")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("receipts.receiptNo")}</TH>
              <TH>{t("receipts.date")}</TH>
              <TH>{t("receipts.member")}</TH>
              <TH className="text-right">{t("receipts.amount")}</TH>
              <TH>{t("receipts.mode")}</TH>
              <TH />
            </TR>
          </THead>
          <tbody>
            {receipts.map((r) => (
              <TR key={r.id}>
                <TD className="font-mono">{r.receiptNumber}</TD>
                <TD>{new Date(r.receiptDate).toLocaleDateString("en-IN")}</TD>
                <TD>
                  <Link
                    href={`/members/${r.memberId}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {r.member.fullName}
                  </Link>
                </TD>
                <TD className="text-right tabular font-medium">
                  {formatINR(r.payment.amount.toString())}
                </TD>
                <TD>{r.payment.paymentMode.name}</TD>
                <TD>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={`${pfx}/receipts/${r.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("receipts.downloadPdf")}
                    </a>
                    {canSend && (
                      <WaSendButton
                        kind="receipt"
                        id={r.id}
                        label={t("whatsapp.send")}
                      />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
