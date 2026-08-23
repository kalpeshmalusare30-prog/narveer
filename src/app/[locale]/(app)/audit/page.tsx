import { setRequestLocale, getTranslations } from "next-intl/server";
import { History } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listAuditLogs } from "@/features/audit/query";
import {
  PageHeader,
  Table,
  THead,
  TR,
  TH,
  TD,
  Badge,
  EmptyState,
} from "@/components/ui";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("audit.view")) {
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations();
  const logs = await listAuditLogs();

  return (
    <div>
      <PageHeader title={t("nav.auditLogs")} />
      {logs.length === 0 ? (
        <EmptyState icon={<History className="h-6 w-6" />} title="—" />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("audit.dateTime")}</TH>
              <TH>{t("audit.user")}</TH>
              <TH>{t("audit.module")}</TH>
              <TH>{t("audit.action")}</TH>
              <TH>{t("audit.record")}</TH>
            </TR>
          </THead>
          <tbody>
            {logs.map((l) => (
              <TR key={l.id}>
                <TD className="whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString("en-IN")}
                </TD>
                <TD>{l.userName}</TD>
                <TD className="capitalize">{l.module}</TD>
                <TD>
                  <Badge tone="indigo">{l.action}</Badge>
                </TD>
                <TD className="font-mono text-xs text-slate-500">
                  {l.recordType}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
