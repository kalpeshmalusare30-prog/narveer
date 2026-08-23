"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toggleOrgActiveAction } from "@/features/organizations/actions";

export function OrgActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const t = useTranslations("organizations");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await toggleOrgActiveAction(id, !active);
          router.refresh();
        })
      }
      className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
    >
      {active ? t("deactivate") : t("activate")}
    </button>
  );
}
