"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createUserForm, type SaveState } from "@/features/users/actions";
import { Button, Input, Field, Alert, Card } from "@/components/ui";

export function UserForm({ roles }: { roles: { id: string; name: string }[] }) {
  const t = useTranslations();
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createUserForm,
    {},
  );
  useEffect(() => {
    if (state.success) router.push("/users");
  }, [state.success, router]);

  return (
    <Card className="max-w-lg">
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <Field label={t("users.fullName")} htmlFor="fullName" required>
          <Input id="fullName" name="fullName" required />
        </Field>
        <Field label={t("users.loginId")} htmlFor="loginId" required>
          <Input id="loginId" name="loginId" required autoComplete="off" />
        </Field>
        <Field label={t("users.email")} htmlFor="email">
          <Input id="email" name="email" type="email" />
        </Field>
        <Field label={t("users.mobile")} htmlFor="mobile">
          <Input id="mobile" name="mobile" />
        </Field>
        <Field label={t("users.password")} htmlFor="password" required>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </Field>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-700">
            {t("users.roles")}
          </div>
          <div className="flex flex-col gap-1">
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="roleIds" value={r.id} />
                {r.name}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {t("common.create")}
        </Button>
      </form>
    </Card>
  );
}
