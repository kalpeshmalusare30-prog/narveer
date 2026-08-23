import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getMember } from "@/features/members/query";
import { getSessionUser } from "@/lib/auth/session";
import { listMemberFees, getMemberTotalPending } from "@/features/finance/fee-query";
import { listMemberPayments } from "@/features/payments/query";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
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
  const canViewFees = !!user?.permissions.includes("fee.view");
  const canViewPayments = !!user?.permissions.includes("payment.view");
  const canViewReceipts = !!user?.permissions.includes("receipt.view");
  const fmtDate = (d?: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-IN") : "";

  const feeRows = canViewFees ? await listMemberFees(member!.id) : [];
  const totalPending = canViewFees
    ? await getMemberTotalPending(member!.id)
    : "0";
  const payments = canViewPayments
    ? await listMemberPayments(member!.id)
    : [];
  const pfx = locale === "en" ? "" : `/${locale}`;

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
                <Badge tone={f.pending === "0" ? "green" : "amber"}>
                  {f.status}
                </Badge>
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
      <ProfileTabs
        personal={personal}
        membership={membership}
        annualFees={annualFeesNode}
        payments={paymentsNode}
        receipts={receiptsNode}
      />
    </div>
  );
}
