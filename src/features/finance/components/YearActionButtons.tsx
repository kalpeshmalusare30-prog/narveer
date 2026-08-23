"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  toggleYearActiveAction,
  toggleYearClosedAction,
} from "@/features/finance/year-actions";

export function YearActionButtons({
  id,
  isActive,
  isClosed,
}: {
  id: string;
  isActive: boolean;
  isClosed: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleYearActiveAction(id, !isActive);
            router.refresh();
          })
        }
        className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
      >
        {isActive ? t("common.inactive") : t("common.active")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await toggleYearClosedAction(id, !isClosed);
            router.refresh();
          })
        }
        className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
      >
        {isClosed ? t("finance.reopen") : t("finance.close")}
      </button>
    </div>
  );
}
