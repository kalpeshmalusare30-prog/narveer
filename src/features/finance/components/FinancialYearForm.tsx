"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createFinancialYearForm,
  type SaveState,
} from "@/features/finance/year-actions";
import { Button, Input, Field } from "@/components/ui";

export function FinancialYearForm() {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createFinancialYearForm,
    {},
  );
  useEffect(() => {
    if (state.success) {
      router.refresh();
      ref.current?.reset();
    }
  }, [state, router]);

  return (
    <form ref={ref} action={action} className="mb-4 flex flex-wrap items-end gap-3">
      <Field label={t("finance.label")}>
        <Input name="label" required placeholder="2024-25" className="w-40" />
      </Field>
      <Field label={t("finance.feeAmount")}>
        <Input name="feeAmount" required defaultValue="1000" className="w-32" />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("common.add")}
      </Button>
      {state.error && (
        <span className="text-sm text-red-600">{state.error}</span>
      )}
    </form>
  );
}
