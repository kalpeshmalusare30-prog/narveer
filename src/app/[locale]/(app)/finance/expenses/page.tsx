import { setRequestLocale, getTranslations } from "next-intl/server";
import { TrendingDown } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listExpenses, getExpenseFormData } from "@/features/finance/money-query";
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
import { formatINR } from "@/lib/money/money";
import { ExpenseForm } from "@/features/finance/components/ExpenseForm";
import { MoneyVoidButton } from "@/features/finance/components/MoneyVoidButton";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canCreate = !!me?.permissions.includes("expense.create");
  const canVoid = !!me?.permissions.includes("expense.void");

  const rows = await listExpenses();
  const formData = canCreate
    ? await getExpenseFormData()
    : { categories: [], modes: [] };

  return (
    <div>
      <PageHeader title={t("expenses.title")} />
      {canCreate && (
        <ExpenseForm categories={formData.categories} modes={formData.modes} />
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="h-6 w-6" />}
          title={t("expenses.none")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("expenses.date")}</TH>
              <TH>{t("expenses.category")}</TH>
              <TH>{t("expenses.paidTo")}</TH>
              <TH>{t("expenses.description")}</TH>
              <TH className="text-right">{t("expenses.amount")}</TH>
              {canVoid && <TH />}
            </TR>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{new Date(r.expenseDate).toLocaleDateString("en-IN")}</TD>
                <TD>{r.expenseCategory?.name ?? "—"}</TD>
                <TD>{r.paidTo ?? "—"}</TD>
                <TD>{r.description ?? "—"}</TD>
                <TD className="text-right tabular font-medium">
                  {formatINR(r.amount.toString())}
                  {r.isVoided && (
                    <Badge tone="red">{t("expenses.voided")}</Badge>
                  )}
                </TD>
                {canVoid && (
                  <TD>
                    {!r.isVoided && (
                      <MoneyVoidButton id={r.id} kind="expense" />
                    )}
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
