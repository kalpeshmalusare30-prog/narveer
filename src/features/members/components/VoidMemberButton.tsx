"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { voidMemberAction } from "@/features/members/actions";

export function VoidMemberButton({ id }: { id: string }) {
  const t = useTranslations("members");
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await voidMemberAction(id);
          router.refresh();
        })
      }
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {t("void")}
    </button>
  );
}
