import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getCommunicationConfig } from "@/features/communication/query";
import { PageHeader, Card } from "@/components/ui";
import { CommunicationForm } from "@/features/communication/components/CommunicationForm";
import { UpiQr } from "@/features/communication/components/UpiQr";

export const dynamic = "force-dynamic";

export default async function CommunicationSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("communication.manage")) {
    redirect({ href: "/settings", locale });
  }
  const t = await getTranslations("communication");
  const config = await getCommunicationConfig();

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CommunicationForm config={config} />
        {config?.upiId && (
          <Card className="h-fit">
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
              {t("payViaUpi")}
            </h2>
            <UpiQr
              payeeVpa={config.upiId}
              payeeName={config.upiPayeeName}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
