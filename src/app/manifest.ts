import type { MetadataRoute } from "next";
import { rawDb } from "@/lib/db/raw";

export const dynamic = "force-dynamic";

/**
 * PWA manifest, built from the organization record so the installed app
 * carries the mandal's own name (Marathi-first when that is the default
 * locale). Nothing org-specific is hard-coded.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // The primary (first-provisioned) organization — the manifest is served
  // without a session, so there is no tenant context to scope by.
  const org = await rawDb.organization
    .findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { name: true, nameMr: true, shortName: true, defaultLocale: true },
    })
    .catch(() => null);
  const name =
    (org?.defaultLocale === "mr" ? org?.nameMr?.trim() : null) ||
    org?.name ||
    "Mandal CRM";

  return {
    name,
    short_name: org?.shortName || name,
    description: "Membership & vargani manager",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f3ef",
    theme_color: "#e0400f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
