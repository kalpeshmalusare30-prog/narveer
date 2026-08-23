import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";
import { Card } from "@/components/ui";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) redirect({ href: "/dashboard", locale });

  const t = await getTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t("app.name")}
        </h1>
        <p className="mb-6 text-sm text-slate-500">{t("auth.signInTitle")}</p>
        <LoginForm />
      </Card>
    </div>
  );
}
