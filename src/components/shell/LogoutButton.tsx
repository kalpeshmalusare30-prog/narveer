"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const t = useTranslations("auth");
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <LogOut className="h-4 w-4" />
        {t("logout")}
      </button>
    </form>
  );
}
