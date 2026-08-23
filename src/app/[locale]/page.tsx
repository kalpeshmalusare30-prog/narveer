import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  if (user!.isSuperAdmin && !user!.organizationId) {
    redirect({ href: "/organizations", locale });
  }
  redirect({ href: "/dashboard", locale });
}
