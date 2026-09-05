import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { rawDb } from "@/lib/db/raw";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "../globals.css";

// The app is session- and database-driven; render per request (never cache a
// logged-out shell for a logged-in user).
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#e0400f",
};

export async function generateMetadata(): Promise<Metadata> {
  const org = await rawDb.organization
    .findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { name: true, shortName: true },
    })
    .catch(() => null);
  const title = org?.shortName || org?.name || "Mandal CRM";
  return {
    title,
    appleWebApp: { capable: true, statusBarStyle: "default", title },
    icons: { apple: "/icons/apple-touch-icon.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
