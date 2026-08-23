import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getRole } from "@/features/roles/query";
import { RolePermissionsForm } from "@/features/roles/components/RolePermissionsForm";
import { PageHeader, Badge } from "@/components/ui";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const role = await getRole(id);
  if (!role) notFound();
  const selected = role!.rolePermissions.map((rp) => rp.permissionKey);

  return (
    <div>
      <PageHeader
        title={`${t("roles.edit")}: ${role!.name}`}
        actions={
          role!.isSystem ? <Badge tone="amber">{t("roles.system")}</Badge> : null
        }
      />
      <RolePermissionsForm roleId={role!.id} selected={selected} />
    </div>
  );
}
