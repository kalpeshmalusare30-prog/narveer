"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { deleteRoleAction } from "@/features/roles/actions";

export function DeleteRoleButton({ id }: { id: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteRoleAction(id);
          router.refresh();
        })
      }
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
