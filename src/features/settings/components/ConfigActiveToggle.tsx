"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  toggleMembershipTypeAction,
  toggleMemberStatusAction,
} from "@/features/settings/config-actions";

export function ConfigActiveToggle({
  id,
  active,
  kind,
}: {
  id: string;
  active: boolean;
  kind: "type" | "status";
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
