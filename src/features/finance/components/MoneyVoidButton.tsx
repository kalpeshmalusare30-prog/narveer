"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { voidIncomeAction } from "@/features/finance/income-actions";
import { voidExpenseAction } from "@/features/finance/expense-actions";

export function MoneyVoidButton({
  id,
  kind,
}: {
  id: string;
  kind: "income" | "expense";
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if (kind === "income") await voidIncomeAction(id);
          else await voidExpenseAction(id);
          router.refresh();
        })
      }
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
