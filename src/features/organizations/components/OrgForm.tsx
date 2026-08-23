"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createOrgForm, type SaveState } from "@/features/organizations/actions";
import { Button, Input, Field, Alert, Card } from "@/components/ui";

export function OrgForm() {
  const t = useTranslations();
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createOrgForm,
    {},
  );
  useEffect(() => {
    if (state.success) router.push("/organizations");
  }, [state.success, router]);

  return (
    <Card className="max-w-lg">
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <Field label={t("common.name")} htmlFor="name" required>
          <Input id="name" name="name" required />
        </Field>
        <Field label={t("organizations.shortName")} htmlFor="shortName" required>
          <Input id="shortName" name="shortName" required />
        </Field>
        <Field label={t("organizations.city")} htmlFor="city">
          <Input id="city" name="city" />
        </Field>
        <Field label={t("organizations.contact")} htmlFor="contactNumber">
          <Input id="contactNumber" name="contactNumber" />
        </Field>
        <Field label={t("organizations.email")} htmlFor="email">
          <Input id="email" name="email" type="email" />
        </Field>
        <Button type="submit" disabled={pending}>
          {t("common.create")}
        </Button>
      </form>
    </Card>
  );
}
