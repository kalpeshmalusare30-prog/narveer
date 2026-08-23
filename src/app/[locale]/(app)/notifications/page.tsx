import { setRequestLocale, getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listNotifications } from "@/features/notifications/query";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";
import { MarkAllReadButton } from "@/features/notifications/components/MarkAllReadButton";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("notification.view")) {
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations("notifications");
  const rows = await listNotifications();
  const hasUnread = rows.some((r) => !r.isRead);

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={hasUnread ? <MarkAllReadButton /> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={<Bell className="h-6 w-6" />} title={t("none")} />
      ) : (
        <Card className="divide-y divide-slate-100 !p-0">
          {rows.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-5 py-3 ${
                n.isRead ? "" : "bg-indigo-50/50"
              }`}
            >
              <div className="mt-0.5">
                {!n.isRead && (
                  <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-800">{n.message}</div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString("en-IN")}
                </div>
              </div>
              <Badge tone="slate">{n.type}</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
