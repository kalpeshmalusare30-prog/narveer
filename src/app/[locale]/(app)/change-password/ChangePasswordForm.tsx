"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePasswordAction, type FormState } from "@/lib/auth/actions";
import { Button, Input, Field, Alert } from "@/components/ui";

export function ChangePasswordForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    {},
  );

  return (
    <form action={action} className="max-w-sm space-y-4">
      {state.error && <Alert>{t(`auth.${state.error}`)}</Alert>}
      {state.success && (
        <Alert kind="success">{t("auth.passwordChanged")}</Alert>
      )}
      <Field label={t("auth.oldPassword")} htmlFor="oldPassword" required>
        <Input id="oldPassword" name="oldPassword" type="password" required />
      </Field>
      <Field label={t("auth.newPassword")} htmlFor="newPassword" required>
        <Input id="newPassword" name="newPassword" type="password" required />
      </Field>
      <Field
        label={t("auth.confirmPassword")}
        htmlFor="confirmPassword"
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("auth.changePassword")}
      </Button>
    </form>
  );
}
