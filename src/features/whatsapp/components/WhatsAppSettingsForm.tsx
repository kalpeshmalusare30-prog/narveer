"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  saveWhatsAppConfigForm,
  type SaveState,
} from "@/features/whatsapp/settings-actions";
import { Button, Input, Field, Alert, Card } from "@/components/ui";

export function WhatsAppSettingsForm({
  config,
}: {
  config: {
    whatsappProvider: string | null;
    whatsappPhoneId: string | null;
    whatsappToken: string | null;
    whatsappConfigured: boolean;
  } | null;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveWhatsAppConfigForm,
    {},
  );

  return (
    <Card className="mb-6 max-w-xl">
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        {state.success && (
          <Alert kind="success">{t("whatsapp.saved")}</Alert>
        )}
        <Field label={t("whatsapp.provider")}>
          <Input
            name="provider"
            defaultValue={config?.whatsappProvider ?? "meta"}
          />
        </Field>
        <Field label={t("whatsapp.phoneId")}>
          <Input
            name="phoneId"
            defaultValue={config?.whatsappPhoneId ?? ""}
            placeholder="e.g. 123456789012345"
          />
        </Field>
        <Field label={t("whatsapp.token")}>
          <Input
            name="token"
            type="password"
            defaultValue={config?.whatsappToken ?? ""}
            placeholder="WhatsApp Cloud API access token"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={config?.whatsappConfigured ?? false}
          />
          {t("whatsapp.enabled")}
        </label>
        <Button type="submit" disabled={pending}>
          {t("common.save")}
        </Button>
      </form>
    </Card>
  );
}
