import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { OrgForm } from "@/features/organizations/components/OrgForm";
import { PageHeader } from "@/components/ui";

export default async function NewOrganizationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (!user!.isSuperAdmin) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("organizations");
  return (
    <div>
      <PageHeader title={t("add")} />
      <OrgForm />
    </div>
  );
}
