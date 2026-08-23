import { setRequestLocale, getTranslations } from "next-intl/server";
import { TrendingUp } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { listIncome, getIncomeFormData } from "@/features/finance/money-query";
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
import { IncomeForm } from "@/features/finance/components/IncomeForm";
import { MoneyVoidButton } from "@/features/finance/components/MoneyVoidButton";

export default async function IncomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canCreate = !!me?.permissions.includes("income.create");
  const canVoid = !!me?.permissions.includes("income.void");

  const rows = await listIncome();
  const formData = canCreate
    ? await getIncomeFormData()
    : { categories: [], modes: [] };

  return (
    <div>
      <PageHeader title={t("income.title")} />
      {canCreate && (
        <IncomeForm categories={formData.categories} modes={formData.modes} />
      )}
      {rows.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title={t("income.none")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("income.date")}</TH>
              <TH>{t("income.category")}</TH>
              <TH>{t("income.receivedFrom")}</TH>
              <TH>{t("income.mode")}</TH>
              <TH className="text-right">{t("income.amount")}</TH>
              {canVoid && <TH />}
            </TR>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{new Date(r.incomeDate).toLocaleDateString("en-IN")}</TD>
                <TD>{r.incomeCategory?.name ?? "—"}</TD>
                <TD>{r.receivedFrom ?? "—"}</TD>
                <TD>{r.paymentMode?.name ?? "—"}</TD>
                <TD className="text-right tabular font-medium">
                  {formatINR(r.amount.toString())}
                  {r.isVoided && (
                    <Badge tone="red">{t("income.voided")}</Badge>
                  )}
                </TD>
                {canVoid && (
                  <TD>
                    {!r.isVoided && (
                      <MoneyVoidButton id={r.id} kind="income" />
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
