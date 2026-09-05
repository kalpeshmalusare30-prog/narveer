import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { rawDb } from "@/lib/db/raw";
import { Download, Smartphone, Apple, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Public "install the app" page — shareable on WhatsApp. Serves the signed
 * Android APK and explains the iPhone / no-download install paths. Branding
 * (name + logo) comes from the organization record, never hard-coded.
 */
export default async function GetAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("getApp");

  const org = await rawDb.organization
    .findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { name: true, nameMr: true, logoDataUri: true },
    })
    .catch(() => null);
  const orgName =
    (locale === "mr" ? org?.nameMr?.trim() : null) || org?.name || "";

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const pageUrl = `${proto}://${host}/get-app`;
  const qr = host ? await QRCode.toDataURL(pageUrl, { margin: 1, width: 220 }) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-5 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={org?.logoDataUri || "/icons/icon-192.png"}
        alt=""
        className="h-24 w-24 rounded-2xl object-contain"
      />
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {orgName}
        </h1>
        <p className="mt-1 text-lg font-semibold text-indigo-600">{t("title")}</p>
        <p className="mt-2 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      {/* Android */}
      <section className="elev w-full rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Smartphone className="h-4 w-4" /> {t("androidTitle")}
        </h2>
        <a
          href="/app/NTMP-app.apk"
          download
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Download className="h-4 w-4" />
          {t("downloadBtn")}
        </a>
        <p className="mt-2 text-center text-xs text-slate-400">{t("size")}</p>
        <p className="mt-3 text-sm text-slate-600">{t("androidSteps")}</p>
      </section>

      {/* iPhone */}
      <section className="elev w-full rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Apple className="h-4 w-4" /> {t("iosTitle")}
        </h2>
        <p className="mt-3 text-sm text-slate-600">{t("iosSteps")}</p>
      </section>

      {/* No-download PWA path */}
      <section className="elev w-full rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Globe className="h-4 w-4" /> {t("altTitle")}
        </h2>
        <p className="mt-3 text-sm text-slate-600">{t("altSteps")}</p>
      </section>

      {qr && (
        <div className="flex flex-col items-center gap-2 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR" className="h-40 w-40 rounded-xl border border-slate-200 bg-white p-2" />
          <p className="text-xs text-slate-400">{t("qrHint")}</p>
        </div>
      )}
    </main>
  );
}
