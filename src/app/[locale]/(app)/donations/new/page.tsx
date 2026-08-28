import { setRequestLocale, getTranslations } from "next-intl/server";
import { getDonationFormData } from "@/features/donations/query";
import { DonationForm } from "@/features/donations/components/DonationForm";
import { PageHeader } from "@/components/ui";

export default async function NewDonationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("donations");
  const { members, modes } = await getDonationFormData();
  return (
    <div>
      <PageHeader title={t("add")} />
      <DonationForm
        members={members}
        modes={modes.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
