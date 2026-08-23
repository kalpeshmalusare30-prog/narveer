import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listOrganizations } from "@/features/organizations/actions";
import { Link } from "@/i18n/navigation";
import { PageHeader, Button, Badge } from "@/components/ui";
import { OrgActiveToggle } from "@/features/organizations/components/OrgActiveToggle";

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (!user!.isSuperAdmin) redirect({ href: "/dashboard", locale });

  const t = await getTranslations();
  const orgs = await listOrganizations();

  return (
    <div>
      <PageHeader
        title={t("organizations.title")}
        actions={
          <Link href="/organizations/new">
            <Button>{t("organizations.add")}</Button>
          </Link>
        }
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("common.name")}</th>
              <th className="px-4 py-2">{t("organizations.shortName")}</th>
              <th className="px-4 py-2">{t("organizations.city")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr
                key={o.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">{o.name}</td>
                <td className="px-4 py-2">{o.shortName}</td>
                <td className="px-4 py-2">{o.city ?? "—"}</td>
                <td className="px-4 py-2">
                  <Badge tone={o.isActive ? "green" : "red"}>
                    {o.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <OrgActiveToggle id={o.id} active={o.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
