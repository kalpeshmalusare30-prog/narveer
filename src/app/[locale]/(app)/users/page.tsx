import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/session";
import { listUsers } from "@/features/users/actions";
import { Link } from "@/i18n/navigation";
import { PageHeader, Button, Badge } from "@/components/ui";
import { UserRowActions } from "@/features/users/components/UserRowActions";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canCreate = !!me?.permissions.includes("user.create");
  const canManage =
    !!me?.permissions.includes("user.edit") ||
    !!me?.permissions.includes("user.deactivate");
  const users = await listUsers();

  return (
    <div>
      <PageHeader
        title={t("users.title")}
        actions={
          canCreate ? (
            <Link href="/users/new">
              <Button>{t("users.add")}</Button>
            </Link>
          ) : null
        }
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("users.fullName")}</th>
              <th className="px-4 py-2">{t("users.loginId")}</th>
              <th className="px-4 py-2">{t("users.roles")}</th>
              <th className="px-4 py-2">{t("common.status")}</th>
              {canManage && <th className="px-4 py-2">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-medium">{u.fullName}</td>
                <td className="px-4 py-2 font-mono">{u.loginId}</td>
                <td className="px-4 py-2">
                  {u.userRoles.map((ur) => ur.role.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={u.isActive ? "green" : "slate"}>
                    {u.isActive ? t("common.active") : t("common.inactive")}
                  </Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2">
                    <UserRowActions id={u.id} active={u.isActive} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
