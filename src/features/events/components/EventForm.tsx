"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createEvent, type SaveState } from "@/features/events/actions";
import {
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Alert,
  Card,
} from "@/components/ui";

export function EventForm() {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createEvent,
    {},
  );

  useEffect(() => {
    if (state.success && state.id) router.push(`/events/${state.id}`);
  }, [state.success, state.id, router]);

  return (
    <Card>
      <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {state.error && (
          <div className="sm:col-span-2">
            <Alert>{t("createFailed")}</Alert>
          </div>
        )}
        <Field label={t("eventTitle")} required>
          <Input name="title" required />
        </Field>
        <Field label={t("type")} required>
          <Select name="type" defaultValue="Event" required>
            <option value="Event">{t("event")}</option>
            <option value="Meeting">{t("meeting")}</option>
          </Select>
        </Field>
        <Field label={t("date")} required>
          <Input name="eventDate" type="date" required />
        </Field>
        <Field label={t("location")}>
          <Input name="location" />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("description")}>
            <Textarea name="description" rows={3} />
          </Field>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/events")}
          >
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
