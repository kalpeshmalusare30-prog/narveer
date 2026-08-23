"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type FormState } from "@/lib/auth/actions";
import { Button, Input, Field, Alert } from "@/components/ui";

export function LoginForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{t(`auth.${state.error}`)}</Alert>}
      <Field label={t("auth.loginId")} htmlFor="loginId" required>
        <Input id="loginId" name="loginId" required autoComplete="username" />
      </Field>
      <Field label={t("auth.password")} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {t("auth.signIn")}
      </Button>
    </form>
  );
}
