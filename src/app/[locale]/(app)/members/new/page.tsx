import { setRequestLocale, getTranslations } from "next-intl/server";
import { getMemberRefData } from "@/features/members/query";
import { MemberForm } from "@/features/members/components/MemberForm";
import { PageHeader } from "@/components/ui";

export default async function NewMemberPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("members");
  const { statuses, types } = await getMemberRefData();
  return (
    <div>
      <PageHeader title={t("add")} />
      <MemberForm statuses={statuses} types={types} />
    </div>
  );
}
