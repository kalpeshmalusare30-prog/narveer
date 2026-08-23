import { setRequestLocale, getTranslations } from "next-intl/server";
import { listIncomeCategories } from "@/features/settings/query";
import { createIncomeCategoryForm } from "@/features/settings/config-actions";
import { PageHeader, Table, THead, TR, TH, TD, Badge } from "@/components/ui";
import { AddNameForm } from "@/features/settings/components/AddNameForm";
import { ConfigActiveToggle } from "@/features/settings/components/ConfigActiveToggle";

export default async function IncomeCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const rows = await listIncomeCategories();

  return (
    <div>
      <PageHeader title={t("income.title") + " — " + t("income.category")} />
      <AddNameForm action={createIncomeCategoryForm} />
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
                  kind="incomeCategory"
                />
              </TD>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
