"use client";

import { useTransition } from "react";
import { CheckCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { markAllReadAction } from "@/features/notifications/actions";
import { Button } from "@/components/ui";

export function MarkAllReadButton() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      icon={<CheckCheck className="h-4 w-4" />}
      onClick={() =>
        start(async () => {
          await markAllReadAction();
          router.refresh();
        })
      }
    >
      {t("markAllRead")}
    </Button>
  );
}
