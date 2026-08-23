import { setRequestLocale, getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listPendingDues } from "@/features/finance/fee-query";
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

export default async function PendingDuesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canRemind = !!me?.permissions.includes("whatsapp.send");
  const rows = await listPendingDues();

  return (
    <div>
      <PageHeader title={t("finance.pendingDuesTitle")} />
      {rows.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title={t("finance.noPending")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("members.memberCode")}</TH>
              <TH>{t("members.fullName")}</TH>
              <TH>{t("members.mobile")}</TH>
              <TH>{t("finance.pendingYears")}</TH>
              <TH className="text-right">{t("finance.totalPending")}</TH>
              {canRemind && <TH />}
            </TR>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.memberId}>
                <TD className="font-mono">{r.memberCode}</TD>
                <TD>
                  <Link
                    href={`/members/${r.memberId}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {r.memberName}
                  </Link>
                </TD>
                <TD className="tabular">{r.mobile}</TD>
                <TD>{r.pendingYears}</TD>
                <TD className="text-right tabular font-semibold text-rose-600">
                  {formatINR(r.totalPending)}
                </TD>
                {canRemind && (
                  <TD>
                    <WaSendButton
                      kind="reminder"
                      id={r.memberId}
                      label={t("whatsapp.send")}
                    />
                  </TD>
                )}
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
