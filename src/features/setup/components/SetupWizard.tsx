"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  saveOrgDetailsForm,
  saveFinancialConfigForm,
  completeSetupForm,
  type SaveState,
} from "@/features/setup/actions";
import { Button, Input, Field, Alert, Card } from "@/components/ui";

type Org = {
  name: string;
  shortName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactNumber?: string | null;
  email?: string | null;
  financialYearStart: number;
  financialYearEnd: number;
  defaultMembershipFee: string;
  receiptNumberPrefix: string;
  memberCodePrefix: string;
};

export function SetupWizard({ org }: { org: Org }) {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [finishing, startFinish] = useTransition();
  const [detailsState, detailsAction, dp] = useActionState<SaveState, FormData>(
    saveOrgDetailsForm,
    {},
  );
  const [finState, finAction, fp] = useActionState<SaveState, FormData>(
    saveFinancialConfigForm,
    {},
  );
  useEffect(() => {
    if (detailsState.success) setStep(1);
  }, [detailsState]);
  useEffect(() => {
    if (finState.success) setStep(2);
  }, [finState]);

  const steps = [
    t("setup.orgDetails"),
    t("setup.financialConfig"),
    t("setup.communication"),
    t("setup.complete"),
  ];

  return (
    <div>
      <div className="mb-4 text-sm text-slate-500" data-testid="setup-step">
        {t("setup.step", { n: step + 1, total: steps.length })} — {steps[step]}
      </div>

      {step === 0 && (
        <Card>
          <form
            action={detailsAction}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {detailsState.error && (
              <div className="sm:col-span-2">
                <Alert>{detailsState.error}</Alert>
              </div>
            )}
            <Field label={t("common.name")} required>
              <Input name="name" defaultValue={org.name} required />
            </Field>
            <Field label={t("organizations.shortName")} required>
              <Input name="shortName" defaultValue={org.shortName} required />
            </Field>
            <Field label={t("members.address")}>
              <Input name="address" defaultValue={org.address ?? ""} />
            </Field>
            <Field label={t("organizations.city")}>
              <Input name="city" defaultValue={org.city ?? ""} />
            </Field>
            <Field label={t("organizations.contact")}>
              <Input
                name="contactNumber"
                defaultValue={org.contactNumber ?? ""}
              />
            </Field>
            <Field label={t("organizations.email")}>
              <Input name="email" type="email" defaultValue={org.email ?? ""} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={dp}>
                {t("setup.next")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <form
            action={finAction}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {finState.error && (
              <div className="sm:col-span-2">
                <Alert>{finState.error}</Alert>
              </div>
            )}
            <Field label={t("setup.financialYearStart")} required>
              <Input
                name="financialYearStart"
                type="number"
                min={1}
                max={12}
                defaultValue={org.financialYearStart}
                required
              />
            </Field>
            <Field label={t("setup.financialYearEnd")} required>
              <Input
                name="financialYearEnd"
                type="number"
                min={1}
                max={12}
                defaultValue={org.financialYearEnd}
                required
              />
            </Field>
            <Field label={t("setup.defaultFee")} required>
              <Input
                name="defaultMembershipFee"
                defaultValue={org.defaultMembershipFee}
                required
              />
            </Field>
            <Field label={t("setup.receiptPrefix")} required>
              <Input
                name="receiptNumberPrefix"
                defaultValue={org.receiptNumberPrefix}
                required
              />
            </Field>
            <Field label={t("setup.memberCodePrefix")} required>
              <Input
                name="memberCodePrefix"
                defaultValue={org.memberCodePrefix}
                required
              />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(0)}
              >
                {t("common.back")}
              </Button>
              <Button type="submit" disabled={fp}>
                {t("setup.next")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <p className="mb-4 text-sm text-slate-600">{t("setup.commsStub")}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
            >
              {t("common.back")}
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              {t("setup.next")}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <p className="mb-4 text-sm text-slate-600">{t("setup.done")}</p>
          <Button
            type="button"
            disabled={finishing}
            onClick={() =>
              startFinish(async () => {
                await completeSetupForm();
                router.push("/dashboard");
              })
            }
          >
            {t("setup.finish")}
          </Button>
        </Card>
      )}
    </div>
  );
}
