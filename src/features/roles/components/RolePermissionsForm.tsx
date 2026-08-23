"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  updateRolePermissionsForm,
  type SaveState,
} from "@/features/roles/actions";
import { Button, Alert, Card } from "@/components/ui";
import { PermissionCheckboxes } from "./PermissionCheckboxes";

export function RolePermissionsForm({
  roleId,
  selected,
}: {
  roleId: string;
  selected: string[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    updateRolePermissionsForm,
    {},
  );
  useEffect(() => {
    if (state.success) router.push("/roles");
  }, [state.success, router]);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="roleId" value={roleId} />
        {state.error && <Alert>{state.error}</Alert>}
        {state.success && <Alert kind="success">{t("roles.updated")}</Alert>}
        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">
            {t("roles.permissions")}
          </div>
          <PermissionCheckboxes selected={selected} />
        </div>
        <Button type="submit" disabled={pending}>
          {t("common.save")}
        </Button>
      </form>
    </Card>
  );
}
