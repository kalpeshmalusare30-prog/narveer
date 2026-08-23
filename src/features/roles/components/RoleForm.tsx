"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createRoleForm, type SaveState } from "@/features/roles/actions";
import { Button, Input, Textarea, Field, Alert, Card } from "@/components/ui";
import { PermissionCheckboxes } from "./PermissionCheckboxes";

export function RoleForm() {
  const t = useTranslations();
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createRoleForm,
    {},
  );
  useEffect(() => {
    if (state.success) router.push("/roles");
  }, [state.success, router]);

  return (
    <Card>
      <form action={action} className="space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        <Field label={t("roles.name")} htmlFor="name" required>
          <Input id="name" name="name" required className="max-w-sm" />
        </Field>
        <Field label={t("roles.description")} htmlFor="description">
          <Textarea id="description" name="description" rows={2} />
        </Field>
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">
            {t("roles.permissions")}
          </div>
          <PermissionCheckboxes />
        </div>
        <Button type="submit" disabled={pending}>
          {t("common.create")}
        </Button>
      </form>
    </Card>
  );
}
