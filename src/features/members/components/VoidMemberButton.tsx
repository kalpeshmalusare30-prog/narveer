"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { UserX } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { voidMemberAction } from "@/features/members/actions";
import { Button } from "@/components/ui";

export function VoidMemberButton({ id }: { id: string }) {
  const t = useTranslations("members");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="secondary"
        size="sm"
        icon={<UserX className="h-4 w-4" />}
        onClick={() => setConfirming(true)}
      >
        {t("void")}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {t("confirmVoid")}
      </span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await voidMemberAction(id);
            setConfirming(false);
            router.refresh();
          })
        }
      >
        {t("void")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        {tc("cancel")}
      </Button>
    </div>
  );
}
