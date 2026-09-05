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

/** Compact icon-only logout for the mobile top bar (always visible in the
 *  installed app, where there is no browser UI to clear the session). */
export function LogoutIconButton() {
  const t = useTranslations("auth");
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label={t("logout")}
        title={t("logout")}
        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </form>
  );
}
