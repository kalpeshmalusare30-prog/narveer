import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getWhatsAppConfig, listTemplates } from "@/features/whatsapp/query";
import { PageHeader } from "@/components/ui";
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

  return (
    <div>
      <PageHeader title={t("whatsapp.settingsTitle")} />
      <WhatsAppSettingsForm config={config} />
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
