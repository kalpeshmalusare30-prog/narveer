"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveMemberForm, type SaveState } from "@/features/members/actions";
import {
  Button,
  Input,
  Select,
  Textarea,
  Field,
  Alert,
  Card,
} from "@/components/ui";

type Option = { id: string; name: string };
export type MemberFormData = {
  id: string;
  fullName: string;
  mobile: string;
  whatsappNumber?: string | null;
  alternateMobile?: string | null;
  email?: string | null;
  address?: string | null;
  area?: string | null;
  dateOfBirth?: string | null;
  joiningDate?: string | null;
  membershipTypeId?: string | null;
  statusId: string;
  notes?: string | null;
};

export function MemberForm({
  statuses,
  types,
  member,
}: {
  statuses: Option[];
  types: Option[];
  member?: MemberFormData;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveMemberForm,
    {},
  );

  useEffect(() => {
    if (state.success) router.push("/members");
  }, [state.success, router]);

  return (
    <Card>
      <form action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {member && <input type="hidden" name="id" value={member.id} />}
        {state.error && (
          <div className="sm:col-span-2">
            <Alert>{state.error}</Alert>
          </div>
        )}
        <Field label={t("members.fullName")} htmlFor="fullName" required>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={member?.fullName ?? ""}
            required
          />
        </Field>
        <Field label={t("members.mobile")} htmlFor="mobile" required>
          <Input
            id="mobile"
            name="mobile"
            defaultValue={member?.mobile ?? ""}
            required
          />
        </Field>
        <Field label={t("members.whatsapp")} htmlFor="whatsappNumber">
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            defaultValue={member?.whatsappNumber ?? ""}
          />
        </Field>
        <Field label={t("members.alternateMobile")} htmlFor="alternateMobile">
          <Input
            id="alternateMobile"
            name="alternateMobile"
            defaultValue={member?.alternateMobile ?? ""}
          />
        </Field>
        <Field label={t("members.email")} htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={member?.email ?? ""}
          />
        </Field>
        <Field label={t("members.area")} htmlFor="area">
          <Input id="area" name="area" defaultValue={member?.area ?? ""} />
        </Field>
        <Field label={t("members.status")} htmlFor="statusId" required>
          <Select
            id="statusId"
            name="statusId"
            defaultValue={member?.statusId ?? ""}
            required
          >
            <option value="" disabled>
              --
            </option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("members.membershipType")} htmlFor="membershipTypeId">
          <Select
            id="membershipTypeId"
            name="membershipTypeId"
            defaultValue={member?.membershipTypeId ?? ""}
          >
            <option value="">{t("common.none")}</option>
            {types.map((ty) => (
              <option key={ty.id} value={ty.id}>
                {ty.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("members.dob")} htmlFor="dateOfBirth">
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={member?.dateOfBirth ?? ""}
          />
        </Field>
        <Field label={t("members.joiningDate")} htmlFor="joiningDate">
          <Input
            id="joiningDate"
            name="joiningDate"
            type="date"
            defaultValue={member?.joiningDate ?? ""}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("members.address")} htmlFor="address">
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={member?.address ?? ""}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("members.notes")} htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={member?.notes ?? ""}
            />
          </Field>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {t("common.save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/members")}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
