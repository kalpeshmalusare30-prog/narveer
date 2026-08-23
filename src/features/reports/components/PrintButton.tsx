"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrintButton() {
  const t = useTranslations("reports");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
    >
      <Printer className="h-4 w-4" />
      {t("exportPdf")}
    </button>
  );
}
