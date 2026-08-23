import { setRequestLocale, getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listMessages, getWhatsAppStatus } from "@/features/whatsapp/query";
import { listPendingDues } from "@/features/finance/fee-query";
import { Link } from "@/i18n/navigation";
import {
  PageHeader,
  Alert,
  Table,
  THead,
  TR,
  TH,
  TD,
  StatusBadge,
  EmptyState,
} from "@/components/ui";
import { BulkReminderPanel } from "@/features/whatsapp/components/BulkReminderPanel";

export default async function WhatsAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const perms = me?.permissions ?? [];

  const { configured } = await getWhatsAppStatus();
  const messages = await listMessages();
  const canBulk = perms.includes("whatsapp.send") && perms.includes("fee.view");
  const pending = canBulk
    ? (await listPendingDues()).map((r) => ({
        memberId: r.memberId,
        memberName: r.memberName,
        memberCode: r.memberCode,
        totalPending: r.totalPending,
      }))
    : [];
  const canConfigure = perms.includes("settings.whatsapp.manage");

  return (
    <div>
      <PageHeader title={t("whatsapp.title")} />

      {!configured && (
        <div className="mb-6">
          <Alert kind="warning">
            <div className="font-medium">{t("whatsapp.notConfigured")}</div>
            <div className="mt-1 text-xs">
              {t("whatsapp.notConfiguredHint")}
              {canConfigure && (
                <>
                  {" "}
                  <Link
                    href="/whatsapp/settings"
                    className="font-medium underline"
                  >
                    {t("whatsapp.configure")}
                  </Link>
                </>
              )}
            </div>
          </Alert>
        </div>
      )}

      {canBulk && <BulkReminderPanel members={pending} />}

      <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
        {t("whatsapp.history")}
      </h2>
      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title={t("whatsapp.noMessages")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("whatsapp.sentAt")}</TH>
              <TH>{t("whatsapp.member")}</TH>
              <TH>{t("whatsapp.type")}</TH>
              <TH>{t("whatsapp.to")}</TH>
              <TH>{t("whatsapp.content")}</TH>
              <TH>{t("whatsapp.status")}</TH>
            </TR>
          </THead>
          <tbody>
            {messages.map((m) => (
              <TR key={m.id}>
                <TD>{new Date(m.createdAt).toLocaleString("en-IN")}</TD>
                <TD>{m.member?.fullName ?? "—"}</TD>
                <TD className="capitalize">{m.type}</TD>
                <TD className="tabular">{m.toNumber}</TD>
                <TD>
                  <span
                    className="block max-w-xs truncate"
                    title={m.content}
                  >
                    {m.content}
                  </span>
                </TD>
                <TD>
                  <StatusBadge status={m.status} />
                  {m.failureReason && (
                    <div className="text-[11px] text-slate-400">
                      {m.failureReason}
                    </div>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
