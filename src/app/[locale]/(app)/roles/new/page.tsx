import { setRequestLocale, getTranslations } from "next-intl/server";
import { RoleForm } from "@/features/roles/components/RoleForm";
import { PageHeader } from "@/components/ui";

export default async function NewRolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("roles");
  return (
    <div>
      <PageHeader title={t("add")} />
      <RoleForm />
    </div>
  );
}
