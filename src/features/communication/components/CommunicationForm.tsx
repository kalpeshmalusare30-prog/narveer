"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  saveCommunicationConfig,
  type SaveState,
} from "@/features/communication/actions";
import { Button, Input, Field, Alert, Card, Badge } from "@/components/ui";
import type { CommunicationConfig } from "@/features/communication/query";

function ConfiguredBadge({ configured }: { configured: boolean }) {
  const t = useTranslations("communication");
  return (
    <Badge tone={configured ? "green" : "slate"}>
      {configured ? t("configured") : t("notConfigured")}
    </Badge>
  );
}

export function CommunicationForm({
  config,
}: {
  config: CommunicationConfig | null;
}) {
  const t = useTranslations("communication");
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveCommunicationConfig,
    {},
  );

  return (
    <form action={action} className="space-y-6">
      {state.error && <Alert>{state.error}</Alert>}
      {state.success && <Alert kind="success">{t("saved")}</Alert>}

      {/* UPI */}
      <Card className="max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {t("upi")}
          </h2>
          <ConfiguredBadge configured={!!config?.upiId} />
        </div>
        <p className="mb-4 text-sm text-slate-500">{t("upiHint")}</p>
        <div className="space-y-4">
          <Field label={t("upiId")}>
            <Input
              name="upiId"
              defaultValue={config?.upiId ?? ""}
              placeholder="mandal@upi"
            />
          </Field>
          <Field label={t("payeeName")}>
            <Input
              name="upiPayeeName"
              defaultValue={config?.upiPayeeName ?? ""}
            />
          </Field>
        </div>
      </Card>

      {/* Payment Gateway */}
      <Card className="max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {t("gateway")}
          </h2>
          <ConfiguredBadge configured={!!config?.paymentGatewayConfigured} />
        </div>
        <p className="mb-4 text-sm text-slate-500">{t("gatewayHint")}</p>
        <div className="space-y-4">
          <Field label={t("provider")}>
            <Input
              name="paymentGatewayProvider"
              defaultValue={config?.paymentGatewayProvider ?? ""}
              placeholder="razorpay"
            />
          </Field>
          <Field label={t("keyId")}>
            <Input
              name="paymentGatewayKeyId"
              type="password"
              defaultValue={config?.paymentGatewayKeyId ?? ""}
            />
          </Field>
        </div>
      </Card>

      {/* SMS */}
      <Card className="max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {t("sms")}
          </h2>
          <ConfiguredBadge configured={!!config?.smsConfigured} />
        </div>
        <p className="mb-4 text-sm text-slate-500">{t("gatewayHint")}</p>
        <div className="space-y-4">
          <Field label={t("provider")}>
            <Input
              name="smsProvider"
              defaultValue={config?.smsProvider ?? ""}
            />
          </Field>
          <Field label={t("senderId")}>
            <Input
              name="smsSenderId"
              defaultValue={config?.smsSenderId ?? ""}
            />
          </Field>
        </div>
      </Card>

      {/* Email */}
      <Card className="max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            {t("email")}
          </h2>
          <ConfiguredBadge configured={!!config?.emailConfigured} />
        </div>
        <p className="mb-4 text-sm text-slate-500">{t("gatewayHint")}</p>
        <div className="space-y-4">
          <Field label={t("provider")}>
            <Input
              name="emailProvider"
              defaultValue={config?.emailProvider ?? ""}
            />
          </Field>
          <Field label={t("fromAddress")}>
            <Input
              name="emailFromAddress"
              type="email"
              defaultValue={config?.emailFromAddress ?? ""}
            />
          </Field>
        </div>
      </Card>

      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
