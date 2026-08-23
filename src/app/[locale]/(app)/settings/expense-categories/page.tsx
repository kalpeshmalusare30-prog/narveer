import { setRequestLocale, getTranslations } from "next-intl/server";
import { listExpenseCategories } from "@/features/settings/query";
import { createExpenseCategoryForm } from "@/features/settings/config-actions";
import { PageHeader, Table, THead, TR, TH, TD, Badge } from "@/components/ui";
import { AddNameForm } from "@/features/settings/components/AddNameForm";
import { ConfigActiveToggle } from "@/features/settings/components/ConfigActiveToggle";

export default async function ExpenseCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const rows = await listExpenseCategories();

  return (
    <div>
      <PageHeader title={t("expenses.title") + " — " + t("expenses.category")} />
      <AddNameForm action={createExpenseCategoryForm} />
      <Table>
        <THead>
          <TR>
            <TH>{t("common.name")}</TH>
            <TH>{t("common.status")}</TH>
            <TH>{t("common.actions")}</TH>
          </TR>
        </THead>
        <tbody>
          {rows.map((c) => (
            <TR key={c.id}>
              <TD className="font-medium">{c.name}</TD>
              <TD>
                <Badge tone={c.isActive ? "green" : "slate"}>
                  {c.isActive ? t("common.active") : t("common.inactive")}
                </Badge>
              </TD>
              <TD>
                <ConfigActiveToggle
                  id={c.id}
                  active={c.isActive}
                  kind="expenseCategory"
                />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
