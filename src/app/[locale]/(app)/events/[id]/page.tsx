import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getEvent, getEventFormData } from "@/features/events/query";
import { cancelEventAction } from "@/features/events/actions";
import { memberName } from "@/features/members/name";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { AttendancePanel } from "@/features/events/components/AttendancePanel";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });

  const t = await getTranslations("events");
  const canManage = !!me!.permissions.includes("event.manage");

  const event = await getEvent(id);
  if (!event) notFound();

  const members = canManage ? await getEventFormData() : [];

  async function cancelAction() {
    "use server";
    await cancelEventAction(event!.id);
  }

  return (
    <div>
      <Link
        href="/events"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("back")}
      </Link>
      <PageHeader
        title={event!.title}
        actions={
          canManage && !event!.isCancelled ? (
            <form action={cancelAction}>
              <Button type="submit" variant="danger">
                {t("cancel")}
              </Button>
            </form>
          ) : null
        }
      />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={event!.type === "Meeting" ? "indigo" : "sky"}>
              {event!.type === "Meeting" ? t("meeting") : t("event")}
            </Badge>
            {event!.isCancelled && <Badge tone="red">{t("cancelled")}</Badge>}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-700">
              <dt className="text-slate-500">{t("date")}</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(event!.eventDate).toLocaleDateString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-700">
              <dt className="text-slate-500">{t("location")}</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {event!.location || "—"}
              </dd>
            </div>
          </dl>
          {event!.description && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {event!.description}
            </p>
          )}
        </Card>
      </div>

      {canManage ? (
        <AttendancePanel
          eventId={event!.id}
          members={members}
          attendances={event!.attendances.map((a) => ({
            memberId: a.memberId,
            status: a.status,
          }))}
        />
      ) : (
        <Card>
          <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
            {t("attendance")}
          </h2>
          {event!.attendances.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noEvents")}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {event!.attendances.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {memberName(a.member, locale)}
                  </span>
                  <Badge
                    tone={
                      a.status === "Present"
                        ? "green"
                        : a.status === "Absent"
                          ? "red"
                          : "amber"
                    }
                  >
                    {a.status === "Present"
                      ? t("present")
                      : a.status === "Absent"
                        ? t("absent")
                        : t("excused")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
