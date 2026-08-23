import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getWhatsAppConfig, listTemplates } from "@/features/whatsapp/query";
import { PageHeader, Card } from "@/components/ui";
import { WhatsAppSettingsForm } from "@/features/whatsapp/components/WhatsAppSettingsForm";
import { TemplateEditor } from "@/features/whatsapp/components/TemplateEditor";

export default async function WhatsAppSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("settings.whatsapp.manage")) {
    redirect({ href: "/whatsapp", locale });
  }
  const t = await getTranslations();
  const config = await getWhatsAppConfig();
  const templates = await listTemplates();
  const base = process.env.AUTH_URL || "http://localhost:3000";
  const webhookUrl = `${base}/api/whatsapp/webhook`;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "mandal-crm-verify";

  return (
    <div>
      <PageHeader title={t("whatsapp.settingsTitle")} />
      <WhatsAppSettingsForm config={config} />

      <Card className="mb-6 max-w-xl">
        <h2 className="mb-2 font-semibold text-slate-800">
          {t("whatsapp.webhook")}
        </h2>
        <p className="mb-3 text-sm text-slate-500">{t("whatsapp.webhookHint")}</p>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">{t("whatsapp.webhookUrl")}</dt>
            <dd className="mt-0.5 break-all rounded bg-slate-100 px-2 py-1 font-mono text-xs">
              {webhookUrl}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">{t("whatsapp.verifyToken")}</dt>
            <dd className="mt-0.5 break-all rounded bg-slate-100 px-2 py-1 font-mono text-xs">
              {verifyToken}
            </dd>
          </div>
        </dl>
      </Card>
      <TemplateEditor
        templates={templates.map((tpl) => ({
          id: tpl.id,
          type: tpl.type,
          name: tpl.name,
          body: tpl.body,
        }))}
      />
    </div>
  );
}
