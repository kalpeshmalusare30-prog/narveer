import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMember, getMemberRefData } from "@/features/members/query";
import { MemberForm } from "@/features/members/components/MemberForm";
import { PageHeader } from "@/components/ui";

function dateInput(x?: Date | null): string {
  return x ? new Date(x).toISOString().slice(0, 10) : "";
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("members");
  const member = await getMember(id);
  if (!member) notFound();
  const { statuses, types } = await getMemberRefData();
  const data = {
    id: member!.id,
    fullName: member!.fullName,
    mobile: member!.mobile,
    whatsappNumber: member!.whatsappNumber,
    alternateMobile: member!.alternateMobile,
    email: member!.email,
    address: member!.address,
    area: member!.area,
    dateOfBirth: dateInput(member!.dateOfBirth),
    joiningDate: dateInput(member!.joiningDate),
    membershipTypeId: member!.membershipTypeId,
    statusId: member!.statusId,
    notes: member!.notes,
  };
  return (
    <div>
      <PageHeader title={t("edit")} />
      <MemberForm statuses={statuses} types={types} member={data} />
    </div>
  );
}
