import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { runWithTenant } from "@/lib/db/tenant-context";
import { db } from "@/lib/db/prisma";
import { PageHeader, Card } from "@/components/ui";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (user!.isSuperAdmin && !user!.organizationId) {
    redirect({ href: "/organizations", locale });
  }

  const t = await getTranslations("dashboard");
  const orgId = user!.organizationId!;
  const [total, active] = await runWithTenant(
    { organizationId: orgId, userId: user!.id },
    async () =>
      Promise.all([
        db.member.count(),
        db.member.count({ where: { isActive: true } }),
      ]),
  );

  return (
    <div>
      <PageHeader title={t("title")} />
      <p className="mb-6 text-sm text-slate-500">
        {t("welcome", { name: user!.fullName })}
      </p>
      <div className="grid max-w-xl grid-cols-2 gap-4">
        <Card>
          <div className="text-sm text-slate-500">{t("totalMembers")}</div>
          <div className="mt-1 text-3xl font-bold" data-testid="stat-total">
            {total}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">{t("activeMembers")}</div>
          <div className="mt-1 text-3xl font-bold" data-testid="stat-active">
            {active}
          </div>
        </Card>
      </div>
    </div>
  );
}
