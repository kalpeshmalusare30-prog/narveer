import { setRequestLocale, getTranslations } from "next-intl/server";
import { listOrgRoles } from "@/features/users/actions";
import { UserForm } from "@/features/users/components/UserForm";
import { PageHeader } from "@/components/ui";

export default async function NewUserPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("users");
  const roles = await listOrgRoles();
  return (
    <div>
      <PageHeader title={t("add")} />
      <UserForm roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
    </div>
  );
}
