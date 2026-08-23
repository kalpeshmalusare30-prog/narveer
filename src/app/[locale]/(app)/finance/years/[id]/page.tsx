import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getFinancialYear } from "@/features/finance/year-query";
import {
  getYearCollection,
  listYearFees,
  listAssignableMembers,
} from "@/features/finance/fee-query";
import { PageHeader, Card, Badge } from "@/components/ui";
import { formatINR } from "@/lib/money/money";
import { GenerateAllButton } from "@/features/finance/components/GenerateAllButton";
import { AssignMembersPanel } from "@/features/finance/components/AssignMembersPanel";
import { FeeStatusSelect } from "@/features/finance/components/FeeStatusSelect";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </Card>
  );
}

export default async function YearDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const me = await getSessionUser();
  const canAssign = !!me?.permissions.includes("fee.assign");
  const canWaive = !!me?.permissions.includes("fee.waive");

  const year = await getFinancialYear(id);
  if (!year) notFound();
  const collection = await getYearCollection(id);
  const fees = await listYearFees(id);
  const assignable = canAssign ? await listAssignableMembers(id) : [];

  return (
    <div>
      <PageHeader
        title={`${t("finance.yearDetail")} ${year!.label}`}
        actions={<Badge tone="slate">{formatINR(year!.feeAmount.toString())}</Badge>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tile label={t("finance.expected")} value={formatINR(collection.expected)} />
        <Tile label={t("finance.collected")} value={formatINR(collection.collected)} />
        <Tile label={t("finance.pending")} value={formatINR(collection.pending)} />
        <Tile
          label={t("finance.paidMembers") + " / " + t("finance.pendingMembers")}
          value={`${collection.paidMembers} / ${collection.pendingMembers}`}
        />
      </div>

      {canAssign && (
        <div className="mb-6">
          <GenerateAllButton financialYearId={id} />
          <AssignMembersPanel financialYearId={id} members={assignable} />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
            <tr>
              <th className="px-4 py-2">{t("members.memberCode")}</th>
              <th className="px-4 py-2">{t("members.fullName")}</th>
              <th className="px-4 py-2">{t("finance.feeAmount")}</th>
              <th className="px-4 py-2">{t("finance.collected")}</th>
              <th className="px-4 py-2">{t("finance.pending")}</th>
              <th className="px-4 py-2">{t("finance.feeStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr
                key={f.id}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <td className="px-4 py-2 font-mono">{f.memberCode}</td>
                <td className="px-4 py-2">{f.memberName}</td>
                <td className="px-4 py-2">{formatINR(f.feeAmount)}</td>
                <td className="px-4 py-2">{formatINR(f.paid)}</td>
                <td className="px-4 py-2">{formatINR(f.pending)}</td>
                <td className="px-4 py-2">
                  {canWaive ? (
                    <FeeStatusSelect annualFeeId={f.id} status={f.status} />
                  ) : (
                    <Badge tone={f.pending === "0" ? "green" : "amber"}>
                      {f.status}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
