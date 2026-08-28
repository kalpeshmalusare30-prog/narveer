import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionUser } from "@/lib/auth/session";
import { listMembers, getMemberRefData } from "@/features/members/query";
import { listPendingDues } from "@/features/finance/fee-query";
import { memberName } from "@/features/members/name";
import { Link } from "@/i18n/navigation";
import { PageHeader, Button, StatusBadge, Badge } from "@/components/ui";
import { MemberFilters } from "@/features/members/components/MemberFilters";
import { WaSendButton } from "@/features/whatsapp/components/WaSendButton";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();

  const user = await getSessionUser();
  const canCreate = !!user?.permissions.includes("member.create");
  const canEdit = !!user?.permissions.includes("member.edit");
  const canViewFees = !!user?.permissions.includes("fee.view");
  const canSend = !!user?.permissions.includes("whatsapp.send");

  const page = Number(sp.page ?? "1") || 1;
  const { rows, total, pageSize } = await listMembers({
    q: sp.q,
    statusId: sp.statusId,
    membershipTypeId: sp.membershipTypeId,
    page,
  });
  // Members with outstanding dues (everyone else is fully paid up).
  const pendingByMember = canViewFees
    ? new Map((await listPendingDues()).map((d) => [d.memberId, d.totalPending]))
    : new Map<string, string>();
  const { statuses, types } = await getMemberRefData();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.statusId) params.set("statusId", sp.statusId);
    if (sp.membershipTypeId) params.set("membershipTypeId", sp.membershipTypeId);
    params.set("page", String(p));
    return `/members?${params.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title={t("members.title")}
        actions={
          canCreate ? (
            <Link href="/members/new">
              <Button>{t("members.add")}</Button>
            </Link>
          ) : null
        }
      />
      <MemberFilters
        statuses={statuses}
        types={types}
        current={{
          q: sp.q,
          statusId: sp.statusId,
          membershipTypeId: sp.membershipTypeId,
        }}
      />
      {rows.length === 0 ? (
        <p className="text-slate-500" data-testid="no-members">
          {t("members.noMembers")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-700/40">
              <tr>
                <th className="px-4 py-2">{t("members.memberCode")}</th>
                <th className="px-4 py-2">{t("members.fullName")}</th>
                <th className="px-4 py-2">{t("members.mobile")}</th>
                {canViewFees && (
                  <th className="px-4 py-2">{t("members.payment")}</th>
                )}
                <th className="px-4 py-2">{t("members.status")}</th>
                <th className="px-4 py-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const unpaid = pendingByMember.has(m.id);
                const hasNumber = !!(m.mobile || m.whatsappNumber);
                return (
                  <tr
                    key={m.id}
                    className="border-t border-slate-100 dark:border-slate-700"
                  >
                    <td className="px-4 py-2 font-mono">{m.memberCode}</td>
                    <td className="px-4 py-2">
                      <Link
                        className="font-medium text-indigo-600 hover:underline"
                        href={`/members/${m.id}`}
                      >
                        {memberName(m, locale)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 tabular text-slate-600 dark:text-slate-300">
                      {m.mobile || "—"}
                    </td>
                    {canViewFees && (
                      <td className="px-4 py-2">
                        {unpaid ? (
                          <Badge tone="amber">{t("members.unpaid")}</Badge>
                        ) : (
                          <Badge tone="green">{t("members.paid")}</Badge>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <StatusBadge status={m.status.name} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-4">
                        <Link
                          className="text-xs font-medium text-indigo-600 hover:underline"
                          href={`/members/${m.id}`}
                        >
                          {t("common.view")}
                        </Link>
                        {canEdit && (
                          <Link
                            className="text-xs font-medium text-indigo-600 hover:underline"
                            href={`/members/${m.id}/edit`}
                          >
                            {t("common.edit")}
                          </Link>
                        )}
                        {canSend && hasNumber && (
                          <WaSendButton
                            kind={unpaid ? "reminder" : "thankyou"}
                            id={m.id}
                            label={
                              unpaid ? t("members.remind") : t("members.thanks")
                            }
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="mt-4 flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={qs(p)}
              className={`rounded px-3 py-1 text-sm ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
