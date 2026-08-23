import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui";
import { ImportPanel } from "@/features/import/components/ImportPanel";

export default async function ImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("data.import")) {
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations();
  return (
    <div>
      <PageHeader title={t("import.title")} />
      <ImportPanel />
    </div>
  );
}
