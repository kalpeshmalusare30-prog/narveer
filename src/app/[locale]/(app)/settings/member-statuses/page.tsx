import { setRequestLocale, getTranslations } from "next-intl/server";
import { listMemberStatuses } from "@/features/settings/query";
import { PageHeader, Badge } from "@/components/ui";
import { AddStatusForm } from "@/features/settings/components/AddStatusForm";
import { ConfigActiveToggle } from "@/features/settings/components/ConfigActiveToggle";

export default async function MemberStatusesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const statuses = await listMemberStatuses();

  return (
    <div>
      <PageHeader title={t("settings.memberStatuses")} />
      <AddStatusForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("common.name")}</th>
              <th className="px-4 py-2">{t("settings.terminal")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr
                key={s.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">{s.name}</td>
                <td className="px-4 py-2">
                  {s.isTerminal ? t("common.yes") : t("common.no")}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={s.isActive ? "green" : "slate"}>
                    {s.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <ConfigActiveToggle
                    id={s.id}
                    active={s.isActive}
                    kind="status"
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
