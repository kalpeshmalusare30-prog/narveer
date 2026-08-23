"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function NotificationBell({
  count,
  onNavigate,
}: {
  count: number;
  onNavigate?: () => void;
}) {
  const t = useTranslations("notifications");
  return (
    <Link
      href="/notifications"
      onClick={onNavigate}
      aria-label={t("title")}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
