import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMember, listActiveMembers } from "@/features/members/query";
import { memberName } from "@/features/members/name";
import { getSessionUser } from "@/lib/auth/session";
import { listMemberFees, getMemberTotalPending } from "@/features/finance/fee-query";
import { listMemberPayments } from "@/features/payments/query";
import { listMemberDocuments, listMemberRelations } from "@/features/members/documents";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card, Badge, Button, StatusBadge } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { ProfileTabs } from "@/features/members/components/ProfileTabs";
import { VoidMemberButton } from "@/features/members/components/VoidMemberButton";
import { DocumentsPanel } from "@/features/members/components/DocumentsPanel";
import { PhotoUpload } from "@/features/members/components/PhotoUpload";
import { RelationsPanel } from "@/features/members/components/RelationsPanel";

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
  const ts = await getTranslations("statuses");
  const member = await getMember(id);
  if (!member) notFound();
  const localizeStatus = (s: string) => (ts.has(s) ? ts(s) : s);

  const user = await getSessionUser();
  const canEdit = !!user?.permissions.includes("member.edit");
  const canVoid = !!user?.permissions.includes("member.void");
  const canViewFees = !!user?.permissions.includes("fee.view");
  const canViewPayments = !!user?.permissions.includes("payment.view");
  const canViewReceipts = !!user?.permissions.includes("receipt.view");
  const canViewDocs = !!user?.permissions.includes("document.view");
  const canManageDocs = !!user?.permissions.includes("document.manage");
  const fmtDate = (d?: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "";

  const feeRows = canViewFees ? await listMemberFees(member!.id) : [];
  const totalPending = canViewFees
    ? await getMemberTotalPending(member!.id)
    : "0";
  const payments = canViewPayments
    ? await listMemberPayments(member!.id)
    : [];
  const documentRows = canViewDocs ? await listMemberDocuments(member!.id) : [];
  const relations = await listMemberRelations(member!.id);
  const activeMembers = canEdit
    ? (await listActiveMembers()).filter((m) => m.id !== member!.id)
    : [];
  const pfx = locale === "en" ? "" : `/${locale}`;

  const personal = (
    <Card>
      <Row label={t("members.fullName")} value={memberName(member!, locale)} />
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
      <Row label={t("members.status")} value={localizeStatus(member!.status.name)} />
      <Row label={t("members.joiningDate")} value={fmtDate(member!.joiningDate)} />
    </Card>
  );

  const annualFeesNode = canViewFees ? (
    <Card>
      <div className="mb-3 text-sm">
        {t("finance.totalPending")}:{" "}
        <span className="font-semibold text-red-600">
          {formatINR(totalPending)}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">{t("finance.yearDetail")}</th>
            <th className="py-1">{t("finance.feeAmount")}</th>
            <th className="py-1">{t("finance.collected")}</th>
            <th className="py-1">{t("finance.pending")}</th>
            <th className="py-1">{t("finance.feeStatus")}</th>
          </tr>
        </thead>
        <tbody>
          {feeRows.map((f) => (
            <tr key={f.id} className="border-t border-slate-100">
              <td className="py-1">{f.yearLabel}</td>
              <td className="py-1">{formatINR(f.feeAmount)}</td>
              <td className="py-1">{formatINR(f.paid)}</td>
              <td className="py-1">{formatINR(f.pending)}</td>
              <td className="py-1">
                <StatusBadge status={f.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ) : undefined;

  const paymentsNode = canViewPayments ? (
    <Card>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">{t("payments.date")}</th>
            <th className="py-1">{t("payments.amount")}</th>
            <th className="py-1">{t("payments.mode")}</th>
            <th className="py-1">{t("payments.receiptNo")}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="py-1">
                {new Date(p.paymentDate).toLocaleDateString("en-IN")}
              </td>
              <td className="py-1">
                {formatINR(p.amount.toString())}
                {p.isVoided && <Badge tone="red">{t("payments.voided")}</Badge>}
              </td>
              <td className="py-1">{p.paymentMode.name}</td>
              <td className="py-1">{p.receipt?.receiptNumber ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  ) : undefined;

  const receiptsNode = canViewReceipts ? (
    <Card>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="py-1">{t("receipts.receiptNo")}</th>
            <th className="py-1">{t("receipts.amount")}</th>
            <th className="py-1">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {payments
            .filter((p) => p.receipt)
            .map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-1 font-mono">{p.receipt!.receiptNumber}</td>
                <td className="py-1">{formatINR(p.amount.toString())}</td>
                <td className="py-1">
                  <a
                    href={`${pfx}/receipts/${p.receipt!.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    {t("receipts.downloadPdf")}
                  </a>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </Card>
  ) : undefined;

  const documentsNode = canViewDocs ? (
    <DocumentsPanel
      memberId={member!.id}
      documents={documentRows.map((d) => ({
        id: d.id,
        name: d.name,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        createdAt: d.createdAt.toISOString(),
      }))}
      canManage={canManageDocs}
    />
  ) : undefined;

  const familyNode = (
    <div className="space-y-6">
      <PhotoUpload
        memberId={member!.id}
        photoDataUri={member!.photoDataUri}
        canEdit={canEdit}
      />
      <RelationsPanel
        memberId={member!.id}
        relations={relations.map((r) => ({
          id: r.id,
          relationType: r.relationType,
          relatedMember: {
            id: r.relatedMember.id,
            fullName: r.relatedMember.fullName,
            fullNameEn: r.relatedMember.fullNameEn,
            memberCode: r.relatedMember.memberCode,
          },
        }))}
        activeMembers={activeMembers}
        canEdit={canEdit}
      />
    </div>
  );

  return (
    <div>
      <PageHeader
        title={memberName(member!, locale)}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`${pfx}/members/${member!.id}/card/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="secondary">{t("documents.downloadCard")}</Button>
            </a>
            {canEdit && (
              <Link href={`/members/${member!.id}/edit`}>
                <Button variant="secondary">{t("common.edit")}</Button>
              </Link>
            )}
          </div>
        }
      />
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-sm text-slate-500">
          {member!.memberCode}
        </span>
        <StatusBadge status={member!.status.name} />
      </div>
      {canVoid && member!.isActive && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/5">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {t("members.confirmVoid")}
          </span>
          <VoidMemberButton id={member!.id} />
        </div>
      )}
      <ProfileTabs
        personal={personal}
        membership={membership}
        annualFees={annualFeesNode}
        payments={paymentsNode}
        receipts={receiptsNode}
        documents={documentsNode}
        family={familyNode}
      />
    </div>
  );
}
