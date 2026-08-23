import { setRequestLocale, getTranslations } from "next-intl/server";
import { listMembershipTypes } from "@/features/settings/query";
import { PageHeader, Badge } from "@/components/ui";
import { AddTypeForm } from "@/features/settings/components/AddTypeForm";
import { ConfigActiveToggle } from "@/features/settings/components/ConfigActiveToggle";

export default async function MembershipTypesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const types = await listMembershipTypes();

  return (
    <div>
      <PageHeader title={t("settings.membershipTypes")} />
      <AddTypeForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("common.name")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {types.map((ty) => (
              <tr
                key={ty.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">{ty.name}</td>
                <td className="px-4 py-2">
                  <Badge tone={ty.isActive ? "green" : "slate"}>
                    {ty.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <ConfigActiveToggle
                    id={ty.id}
                    active={ty.isActive}
                    kind="type"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
