import { setRequestLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  collectionReport,
  paymentModeReport,
  incomeByCategoryReport,
  expenseByCategoryReport,
  expenseByYearReport,
  whatsappReport,
  memberReport,
} from "@/features/reports/query";
import { getFinancialSummary } from "@/features/finance/money-query";
import { memberName } from "@/features/members/name";
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

  const [
    collection,
    modes,
    incomeCat,
    expenseCat,
    expenseYears,
    wa,
    members,
    summary,
  ] = await Promise.all([
    collectionReport(),
    paymentModeReport(),
    incomeByCategoryReport(),
    expenseByCategoryReport(),
    expenseByYearReport(),
    whatsappReport(),
    memberReport(),
    getFinancialSummary(),
  ]);

  const sumTotals = (rows: typeof members) =>
    rows.reduce(
      (acc, m) => ({
        expected: acc.expected + Number(m.expected),
        paid: acc.paid + Number(m.paid),
        pending: acc.pending + Number(m.pending),
      }),
      { expected: 0, paid: 0, pending: 0 },
    );
  // split members into those who still owe vs those fully paid up
  const pendingMembers = members.filter((m) => Number(m.pending) > 0);
  const paidMembers = members.filter(
    (m) => Number(m.expected) > 0 && Number(m.pending) === 0,
  );

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

  const MemberFeeTable = ({
    title,
    hint,
    type,
    rows,
    tone,
  }: {
    title: string;
    hint: string;
    type: string;
    rows: typeof members;
    tone: "rose" | "emerald";
  }) => {
    const totals = sumTotals(rows);
    const accent = tone === "rose" ? "text-rose-600" : "text-emerald-600";
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {title}{" "}
              <span className="text-sm font-normal text-slate-400">
                ({rows.length})
              </span>
            </h2>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
          <ExportLink type={type} />
        </div>
        {rows.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">—</p>
          </Card>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3">{t("members.memberCode")}</th>
                  <th className="px-4 py-3">{t("members.fullName")}</th>
                  <th className="px-4 py-3">{t("members.mobile")}</th>
                  <th className="px-4 py-3 text-right">{t("reports.fee")}</th>
                  <th className="px-4 py-3 text-right">{t("reports.paid")}</th>
                  <th className="px-4 py-3 text-right">{t("finance.pending")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.memberCode}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 dark:border-slate-700/60 dark:hover:bg-slate-700/30"
                  >
                    <td className="px-4 py-2.5 font-medium tabular">
                      {m.memberCode}
                    </td>
                    <td className="px-4 py-2.5">
                      {memberName({ fullName: m.name, fullNameEn: m.fullNameEn }, locale)}
                    </td>
                    <td className="px-4 py-2.5 tabular text-slate-500">
                      {m.mobile || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular">
                      {formatINR(m.expected)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-emerald-600">
                      {formatINR(m.paid)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular text-rose-600">
                      {formatINR(m.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-900">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>
                    {t("reports.grandTotal")}
                  </td>
                  <td className="px-4 py-3 text-right tabular">
                    {formatINR(totals.expected)}
                  </td>
                  <td className="px-4 py-3 text-right tabular text-emerald-600">
                    {formatINR(totals.paid)}
                  </td>
                  <td className={`px-4 py-3 text-right tabular ${accent}`}>
                    {formatINR(totals.pending)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    );
  };

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

      {/* Year-wise expenses */}
      <Section title={t("reports.expenseByYear")} type="expense-yearwise">
        <Table>
          <THead>
            <TR>
              <TH>{t("finance.yearDetail")}</TH>
              <TH className="text-right">{t("reports.count")}</TH>
              <TH className="text-right">{t("reports.total")}</TH>
            </TR>
          </THead>
          <tbody>
            {expenseYears.length === 0 ? (
              <TR>
                <TD className="text-slate-500">—</TD>
                <TD />
                <TD />
              </TR>
            ) : (
              expenseYears.map((r) => (
                <TR key={r.year}>
                  <TD className="font-medium">{r.year}</TD>
                  <TD className="text-right tabular">{r.count}</TD>
                  <TD className="text-right tabular text-rose-600">
                    {formatINR(r.total)}
                  </TD>
                </TR>
              ))
            )}
          </tbody>
          {expenseYears.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-900/40">
              <tr>
                <td className="px-4 py-3">{t("reports.grandTotal")}</td>
                <td className="px-4 py-3 text-right tabular">
                  {expenseYears.reduce((s, r) => s + r.count, 0)}
                </td>
                <td className="px-4 py-3 text-right tabular text-rose-600">
                  {formatINR(
                    expenseYears.reduce((s, r) => s + Number(r.total), 0),
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Section>

      {/* Member-wise report split into pending vs completed (PRD §26.1) */}
      <MemberFeeTable
        title={t("reports.pendingPayments")}
        hint={t("reports.pendingPaymentsHint")}
        type="members-pending"
        rows={pendingMembers}
        tone="rose"
      />
      <MemberFeeTable
        title={t("reports.completedPayments")}
        hint={t("reports.completedPaymentsHint")}
        type="members-paid"
        rows={paidMembers}
        tone="emerald"
      />

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
