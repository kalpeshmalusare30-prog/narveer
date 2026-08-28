import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { EventForm } from "@/features/events/components/EventForm";
import { PageHeader } from "@/components/ui";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getSessionUser();
  if (!me) redirect({ href: "/login", locale });
  if (!me!.permissions.includes("event.manage")) {
    redirect({ href: "/events", locale });
  }
  const t = await getTranslations("events");

  return (
    <div>
      <PageHeader title={t("add")} />
      <EventForm />
    </div>
  );
}
