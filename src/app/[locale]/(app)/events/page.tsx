import { setRequestLocale, getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { redirect, Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listEvents } from "@/features/events/query";
import {
  PageHeader,
  Button,
  Table,
  THead,
  TR,
  TH,
  TD,
  Badge,
  EmptyState,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });

  const t = await getTranslations("events");
  const canManage = !!me!.permissions.includes("event.manage");

  const events = await listEvents();

  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          canManage ? (
            <Link href="/events/new">
              <Button>{t("add")}</Button>
            </Link>
          ) : null
        }
      />
      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title={t("noEvents")}
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t("eventTitle")}</TH>
              <TH>{t("type")}</TH>
              <TH>{t("date")}</TH>
              <TH>{t("location")}</TH>
              <TH className="text-right">{t("attendance")}</TH>
            </TR>
          </THead>
          <tbody>
            {events.map((e) => (
              <TR key={e.id}>
                <TD>
                  <Link
                    className="font-medium text-indigo-600 hover:underline"
                    href={`/events/${e.id}`}
                  >
                    {e.title}
                  </Link>
                  {e.isCancelled && (
                    <span className="ml-2">
                      <Badge tone="red">{t("cancelled")}</Badge>
                    </span>
                  )}
                </TD>
                <TD>
                  <Badge tone={e.type === "Meeting" ? "indigo" : "sky"}>
                    {e.type === "Meeting" ? t("meeting") : t("event")}
                  </Badge>
                </TD>
                <TD>{new Date(e.eventDate).toLocaleDateString("en-IN")}</TD>
                <TD>{e.location || "—"}</TD>
                <TD className="text-right tabular">{e._count.attendances}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
