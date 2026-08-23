import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrgSettings } from "@/features/setup/query";
import { SetupWizard } from "@/features/setup/components/SetupWizard";
import { PageHeader } from "@/components/ui";

export default async function SetupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (!user!.permissions.includes("settings.org.manage")) {
    redirect({ href: "/dashboard", locale });
  }
  const t = await getTranslations("setup");
  const org = await getOrgSettings();
  if (!org) redirect({ href: "/dashboard", locale });

  const data = {
    name: org!.name,
    shortName: org!.shortName,
    address: org!.address,
    city: org!.city,
    state: org!.state,
    contactNumber: org!.contactNumber,
    email: org!.email,
    financialYearStart: org!.financialYearStart,
    financialYearEnd: org!.financialYearEnd,
    defaultMembershipFee: org!.defaultMembershipFee.toString(),
    receiptNumberPrefix: org!.receiptNumberPrefix,
    memberCodePrefix: org!.memberCodePrefix,
  };
  return (
    <div>
      <PageHeader title={t("title")} />
      <SetupWizard org={data} />
    </div>
  );
}
