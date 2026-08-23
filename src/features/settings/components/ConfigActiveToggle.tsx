"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  toggleMembershipTypeAction,
  toggleMemberStatusAction,
  togglePaymentModeAction,
  toggleIncomeCategoryAction,
  toggleExpenseCategoryAction,
} from "@/features/settings/config-actions";

export function ConfigActiveToggle({
  id,
  active,
  kind,
}: {
  id: string;
  active: boolean;
  kind: "type" | "status" | "paymentMode" | "incomeCategory" | "expenseCategory";
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
          if (kind === "type") await toggleMembershipTypeAction(id, !active);
          else if (kind === "paymentMode")
            await togglePaymentModeAction(id, !active);
          else if (kind === "incomeCategory")
            await toggleIncomeCategoryAction(id, !active);
          else if (kind === "expenseCategory")
            await toggleExpenseCategoryAction(id, !active);
          else await toggleMemberStatusAction(id, !active);
          router.refresh();
        })
      }
      className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
    >
      {active ? t("inactive") : t("active")}
    </button>
  );
}
