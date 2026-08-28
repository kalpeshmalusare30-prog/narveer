"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  createDonation,
  voidDonation,
  type SaveState,
} from "@/features/donations/actions";
import { Button, Input, Select, Field, Alert, Card } from "@/components/ui";
import { memberName } from "@/features/members/name";

type Member = {
  id: string;
  fullName: string;
  fullNameEn: string | null;
  memberCode: string;
};
type Mode = { id: string; name: string };

export function DonationForm({
  members,
  modes,
}: {
  members: Member[];
  modes: Mode[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(
    createDonation,
    {},
  );

  useEffect(() => {
    if (state.success) {
      router.push("/donations");
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card className="max-w-2xl">
      <form
        ref={ref}
        action={action}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {state.error && (
          <div className="sm:col-span-2">
            <Alert>{t.has(state.error) ? t(state.error) : t("donations.createFailed")}</Alert>
          </div>
        )}
        <Field label={t("donations.donorName")} required>
          <Input name="donorName" required />
        </Field>
        <Field label={t("donations.kind")} required>
          <Select name="kind" defaultValue="Donation">
            <option value="Donation">{t("donations.donation")}</option>
            <option value="Sponsorship">{t("donations.sponsorship")}</option>
          </Select>
        </Field>
        <Field label={t("donations.amount")} required>
          <Input name="amount" inputMode="decimal" required />
        </Field>
        <Field label={t("donations.date")}>
          <Input name="donationDate" type="date" />
        </Field>
        <Field label={t("donations.fromMember")}>
          <Select name="memberId" defaultValue="">
            <option value="">{t("donations.none")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberName(m, locale)} ({m.memberCode})
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("donations.mode")}>
          <Select name="paymentModeId" defaultValue="">
            <option value="">{t("donations.none")}</option>
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("donations.purpose")}>
          <Input name="purpose" />
        </Field>
        <Field label={t("donations.reference")}>
          <Input name="referenceNumber" />
        </Field>
        <Field label={t("donations.receiptNo")}>
          <Input name="receiptNumber" />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("donations.notes")}>
            <Input name="notes" />
          </Field>
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function VoidDonationButton({ id }: { id: string }) {
  const t = useTranslations("donations");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await voidDonation(id);
          router.refresh();
        })
      }
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {t("void")}
    </button>
  );
}
