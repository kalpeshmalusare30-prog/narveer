import { setRequestLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  collectionReport,
  paymentModeReport,
  incomeByCategoryReport,
  expenseByCategoryReport,
  whatsappReport,
} from "@/features/reports/query";
import { getFinancialSummary } from "@/features/finance/money-query";
import {
  PageHeader,
  StatCard,
  Table,
  THead,
  TR,
  TH,
  TD,
  Card,
} from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { PrintButton } from "@/features/reports/components/PrintButton";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("report.view")) {
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations();
  const pfx = locale === "en" ? "" : `/${locale}`;

  const [collection, modes, incomeCat, expenseCat, wa, summary] =
    await Promise.all([
      collectionReport(),
      paymentModeReport(),
      incomeByCategoryReport(),
      expenseByCategoryReport(),
      whatsappReport(),
      getFinancialSummary(),
    ]);

  const ExportLink = ({ type }: { type: string }) => (
    <a
      href={`${pfx}/reports/export/${type}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
    >
      <Download className="h-3.5 w-3.5" />
      {t("reports.exportExcel")}
    </a>
  );

  const Section = ({
    title,
    type,
    children,
  }: {
    title: string;
    type: string;
    children: React.ReactNode;
  }) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <ExportLink type={type} />
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t("reports.title")} actions={<PrintButton />} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("reports.totalIncome")}
          value={formatINR(summary.totalIncome)}
          tone="emerald"
        />
        <StatCard
          label={t("reports.totalExpense")}
          value={formatINR(summary.totalExpense)}
          tone="rose"
        />
        <StatCard
          label={t("dashboard.membershipCollection")}
          value={formatINR(summary.membershipCollection)}
          tone="indigo"
        />
        <StatCard
          label={t("reports.balance")}
          value={formatINR(summary.balance)}
          tone={Number(summary.balance) >= 0 ? "indigo" : "rose"}
        />
      </div>

      <Section title={t("reports.collection")} type="collection">
        <Table>
          <THead>
            <TR>
              <TH>{t("finance.yearDetail")}</TH>
              <TH className="text-right">{t("finance.expected")}</TH>
              <TH className="text-right">{t("finance.collected")}</TH>
              <TH className="text-right">{t("finance.pending")}</TH>
              <TH className="text-right">%</TH>
            </TR>
          </THead>
          <tbody>
            {collection.map((r) => (
              <TR key={r.label}>
                <TD className="font-medium">{r.label}</TD>
                <TD className="text-right tabular">{formatINR(r.expected)}</TD>
                <TD className="text-right tabular text-emerald-600">
                  {formatINR(r.collected)}
                </TD>
                <TD className="text-right tabular text-rose-600">
                  {formatINR(r.pending)}
                </TD>
                <TD className="text-right tabular">{r.percent}%</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Section title={t("reports.paymentModes")} type="payment-modes">
          <NameTotal
            rows={modes}
            label={t("payments.mode")}
            countLabel={t("reports.count")}
            totalLabel={t("reports.total")}
          />
        </Section>
        <Section title={t("dashboard.otherIncome")} type="income">
          <NameTotal
            rows={incomeCat}
            label={t("income.category")}
            countLabel={t("reports.count")}
            totalLabel={t("reports.total")}
          />
        </Section>
        <Section title={t("expenses.title")} type="expense">
          <NameTotal
            rows={expenseCat}
            label={t("expenses.category")}
            countLabel={t("reports.count")}
            totalLabel={t("reports.total")}
          />
        </Section>
        <Section title={t("reports.whatsapp")} type="whatsapp">
          {wa.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">{t("whatsapp.noMessages")}</p>
            </Card>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t("whatsapp.status")}</TH>
                  <TH className="text-right">{t("reports.count")}</TH>
                </TR>
              </THead>
              <tbody>
                {wa.map((r) => (
                  <TR key={r.name}>
                    <TD>{r.name}</TD>
                    <TD className="text-right tabular">{r.count}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </Section>
      </div>

      <Section title={t("reports.pendingDues")} type="pending">
        <Card>
          <p className="text-sm text-slate-500">
            {t("reports.pendingDues")} — {t("reports.exportExcel")}
          </p>
        </Card>
      </Section>
    </div>
  );
}

function NameTotal({
  rows,
  label,
  countLabel,
  totalLabel,
}: {
  rows: { name: string; total: string; count: number }[];
  label: string;
  countLabel: string;
  totalLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">—</p>
      </Card>
    );
  }
  return (
    <Table>
      <THead>
        <TR>
          <TH>{label}</TH>
          <TH className="text-right">{countLabel}</TH>
          <TH className="text-right">{totalLabel}</TH>
        </TR>
      </THead>
      <tbody>
        {rows.map((r) => (
          <TR key={r.name}>
            <TD className="font-medium">{r.name}</TD>
            <TD className="text-right tabular">{r.count}</TD>
            <TD className="text-right tabular">{formatINR(r.total)}</TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
