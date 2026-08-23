"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { voidPaymentAction } from "@/features/payments/actions";

export function VoidPaymentButton({ id }: { id: string }) {
  const t = useTranslations("payments");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await voidPaymentAction(id, "voided from UI");
          router.refresh();
        })
      }
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {t("void")}
    </button>
  );
}
