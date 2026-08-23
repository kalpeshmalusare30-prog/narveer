import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/session";
import { listRoles } from "@/features/roles/actions";
import { Link } from "@/i18n/navigation";
import { PageHeader, Button, Badge } from "@/components/ui";
import { DeleteRoleButton } from "@/features/roles/components/DeleteRoleButton";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canManage = !!me?.permissions.includes("role.manage");
  const roles = await listRoles();

  return (
    <div>
      <PageHeader
        title={t("roles.title")}
        actions={
          canManage ? (
            <Link href="/roles/new">
              <Button>{t("roles.add")}</Button>
            </Link>
          ) : null
        }
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("roles.name")}</th>
              <th className="px-4 py-2">{t("roles.permissions")}</th>
              <th className="px-4 py-2">{t("nav.users")}</th>
              <th className="px-4 py-2">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">
                  {r.name}{" "}
                  {r.isSystem && (
                    <Badge tone="amber">{t("roles.system")}</Badge>
                  )}
                </td>
                <td className="px-4 py-2">{r.rolePermissions.length}</td>
                <td className="px-4 py-2">{r._count.userRoles}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-3">
                    {canManage && (
                      <Link
                        href={`/roles/${r.id}`}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {t("common.edit")}
                      </Link>
                    )}
                    {canManage && !r.isSystem && (
                      <DeleteRoleButton id={r.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
