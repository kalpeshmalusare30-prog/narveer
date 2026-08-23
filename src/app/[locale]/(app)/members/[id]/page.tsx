import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMember } from "@/features/members/query";
import { getSessionUser } from "@/lib/auth/session";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { ProfileTabs } from "@/features/members/components/ProfileTabs";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 dark:text-slate-200">
        {value || "—"}
      </span>
    </div>
  );
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const member = await getMember(id);
  if (!member) notFound();

  const user = await getSessionUser();
  const canEdit = !!user?.permissions.includes("member.edit");
  const fmtDate = (d?: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "";

  const personal = (
    <Card>
      <Row label={t("members.fullName")} value={member!.fullName} />
      <Row label={t("members.mobile")} value={member!.mobile} />
      <Row label={t("members.whatsapp")} value={member!.whatsappNumber} />
      <Row label={t("members.alternateMobile")} value={member!.alternateMobile} />
      <Row label={t("members.email")} value={member!.email} />
      <Row label={t("members.area")} value={member!.area} />
      <Row label={t("members.address")} value={member!.address} />
      <Row label={t("members.dob")} value={fmtDate(member!.dateOfBirth)} />
      <Row label={t("members.notes")} value={member!.notes} />
    </Card>
  );
  const membership = (
    <Card>
      <Row label={t("members.memberCode")} value={member!.memberCode} />
      <Row
        label={t("members.membershipType")}
        value={member!.membershipType?.name}
      />
      <Row label={t("members.status")} value={member!.status.name} />
      <Row label={t("members.joiningDate")} value={fmtDate(member!.joiningDate)} />
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={member!.fullName}
        actions={
          canEdit ? (
            <Link href={`/members/${member!.id}/edit`}>
              <Button variant="secondary">{t("common.edit")}</Button>
            </Link>
          ) : null
        }
      />
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-sm text-slate-500">
          {member!.memberCode}
        </span>
        <Badge tone={member!.isActive ? "green" : "slate"}>
          {member!.status.name}
        </Badge>
      </div>
      <ProfileTabs personal={personal} membership={membership} />
    </div>
  );
}
