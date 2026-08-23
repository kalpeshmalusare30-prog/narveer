"use client";

import { useTranslations } from "next-intl";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const t = useTranslations("auth");
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {t("logout")}
      </button>
    </form>
  );
}
