import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getMusterData } from "@/features/muster/query";
import { getWaClickContext } from "@/features/whatsapp/click-to-send";
import { PageHeader } from "@/components/ui";
import { MusterGrid } from "@/features/muster/components/MusterGrid";

export default async function MusterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (!user!.permissions.includes("member.view")) {
    redirect({ href: "/dashboard", locale });
  }

  const perms = {
    editMember: !!user!.permissions.includes("member.edit"),
    pay: !!user!.permissions.includes("payment.create"),
    create: !!user!.permissions.includes("member.create"),
    deactivate: !!user!.permissions.includes("member.void"),
  };
  const canViewFees = !!user!.permissions.includes("fee.view");
  const canSend = !!user!.permissions.includes("whatsapp.send");

  const data = await getMusterData();
  const wa = canSend ? await getWaClickContext() : null;

  return (
    <div>
      <PageHeader title={t("muster.title")} subtitle={t("muster.subtitle")} />
      <MusterGrid
        data={data}
        locale={locale}
        perms={perms}
        canViewFees={canViewFees}
        wa={wa}
      />
    </div>
  );
}
