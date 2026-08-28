import { setRequestLocale, getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listPayments } from "@/features/payments/query";
import { memberName } from "@/features/members/name";
import { Link } from "@/i18n/navigation";
import {
  PageHeader,
  Button,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  EmptyState,
} from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { VoidPaymentButton } from "@/features/payments/components/VoidPaymentButton";
import { WaSendButton } from "@/features/whatsapp/components/WaSendButton";

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
  const canSend = !!me?.permissions.includes("whatsapp.send");
  const payments = await listPayments();
  const pfx = locale === "en" ? "" : `/${locale}`;

  return (
    <div>
      <PageHeader
        title={t("payments.title")}
        actions={
          canCreate ? (
            <Link href="/payments/new">
              <Button icon={<CreditCard className="h-4 w-4" />}>
                {t("payments.record")}
              </Button>
            </Link>
          ) : null
        }
      />
      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title={t("payments.noPending")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("payments.date")}</TH>
              <TH>{t("payments.member")}</TH>
              <TH className="text-right">{t("payments.amount")}</TH>
              <TH>{t("payments.mode")}</TH>
              <TH>{t("payments.receiptNo")}</TH>
              <TH />
            </TR>
          </THead>
          <tbody>
            {payments.map((p) => (
              <TR key={p.id}>
                <TD>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</TD>
                <TD>
                  <Link
                    href={`/members/${p.memberId}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {memberName(p.member, locale)}
                  </Link>
                </TD>
                <TD className="text-right tabular font-medium">
                  {formatINR(p.amount.toString())}{" "}
                  {p.isVoided && <Badge tone="red">{t("payments.voided")}</Badge>}
                </TD>
                <TD>{p.paymentMode.name}</TD>
                <TD>
                  {p.receipt ? (
                    <a
                      href={`${pfx}/receipts/${p.receipt.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-indigo-600 hover:underline"
                    >
                      {p.receipt.receiptNumber}
                    </a>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD>
                  <div className="flex flex-wrap items-center gap-3">
                    {canSend && !p.isVoided && p.receipt && (
                      <WaSendButton
                        kind="confirmation"
                        id={p.id}
                        label={t("whatsapp.send")}
                      />
                    )}
                    {canVoid && !p.isVoided && <VoidPaymentButton id={p.id} />}
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
