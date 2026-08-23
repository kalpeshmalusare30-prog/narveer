"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { assignAllAction } from "@/features/finance/fee-actions";
import { Button } from "@/components/ui";

export function GenerateAllButton({
  financialYearId,
}: {
  financialYearId: string;
}) {
  const t = useTranslations("finance");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string>();

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await assignAllAction(financialYearId);
            setMsg(t("generated", { count: r.created }));
            router.refresh();
          })
        }
      >
        {t("generateAll")}
      </Button>
      {msg && <span className="text-sm text-green-700">{msg}</span>}
    </div>
  );
}
