"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createMembershipTypeForm,
  type SaveState,
} from "@/features/settings/config-actions";
import { Button, Input } from "@/components/ui";

export function AddTypeForm() {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createMembershipTypeForm,
    {},
  );
  useEffect(() => {
    if (state.success) {
      router.refresh();
      ref.current?.reset();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={action} className="mb-4 flex items-center gap-2">
      <Input
        name="name"
        required
        placeholder={t("common.name")}
        className="max-w-xs"
      />
      <Button type="submit" disabled={pending}>
        {t("common.add")}
      </Button>
      {state.error && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}
    </form>
  );
}
