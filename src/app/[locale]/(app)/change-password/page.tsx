import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { PageHeader } from "@/components/ui";

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div>
      <PageHeader title={t("changePassword")} />
      <ChangePasswordForm />
    </div>
  );
}
