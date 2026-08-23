"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createExpenseForm,
  type SaveState,
} from "@/features/finance/expense-actions";
import { Button, Input, Select, Field, Alert, Card } from "@/components/ui";

type Opt = { id: string; name: string };

export function ExpenseForm({
  categories,
  modes,
}: {
  categories: Opt[];
  modes: Opt[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createExpenseForm,
    {},
  );
  useEffect(() => {
    if (state.success) {
      router.refresh();
      ref.current?.reset();
    }
  }, [state, router]);

  return (
    <Card className="mb-6">
      <form
        ref={ref}
        action={action}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {state.error && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Alert>{state.error}</Alert>
          </div>
        )}
        <Field label={t("expenses.amount")} required>
          <Input name="amount" inputMode="decimal" required />
        </Field>
        <Field label={t("expenses.category")}>
          <Select name="expenseCategoryId" defaultValue="">
            <option value="">{t("common.none")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("expenses.paidTo")}>
          <Input name="paidTo" />
        </Field>
        <Field label={t("expenses.mode")}>
          <Select name="paymentModeId" defaultValue="">
            <option value="">{t("common.none")}</option>
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("expenses.date")}>
          <Input name="expenseDate" type="date" />
        </Field>
        <Field label={t("expenses.billNumber")}>
          <Input name="billNumber" />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label={t("expenses.description")}>
            <Input name="description" />
          </Field>
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            {t("expenses.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
