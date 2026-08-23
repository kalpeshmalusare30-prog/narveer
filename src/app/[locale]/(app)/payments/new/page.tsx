import { setRequestLocale, getTranslations } from "next-intl/server";
import { listActiveMembers } from "@/features/members/query";
import { getPaymentModes } from "@/features/payments/query";
import { RecordPaymentForm } from "@/features/payments/components/RecordPaymentForm";
import { PageHeader } from "@/components/ui";

export default async function NewPaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("payments");
  const [members, modes] = await Promise.all([
    listActiveMembers(),
    getPaymentModes(),
  ]);
  return (
    <div>
      <PageHeader title={t("record")} />
      <RecordPaymentForm
        members={members}
        modes={modes.map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  );
}
