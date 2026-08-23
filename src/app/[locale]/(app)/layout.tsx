import type { ReactNode } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { rawDb } from "@/lib/db/raw";
import { storage } from "@/lib/storage";
import { AppShell } from "@/components/shell/AppShell";

// All authenticated pages depend on the per-request session; never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });

  let orgName: string;
  let logoUrl: string | null = null;
  if (user!.organizationId) {
    const org = await rawDb.organization.findUnique({
      where: { id: user!.organizationId },
      select: { name: true, logoRef: true },
    });
    orgName = org?.name ?? "";
    logoUrl = org?.logoRef ? storage.url(org.logoRef) : null;
  } else {
    const t = await getTranslations("app");
    orgName = t("name");
  }

  return (
    <AppShell
      orgName={orgName}
      logoUrl={logoUrl}
      userName={user!.fullName}
      permissions={user!.permissions}
      isSuperAdmin={user!.isSuperAdmin}
    >
      {children}
    </AppShell>
  );
}
