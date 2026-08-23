import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  // Lint is run separately via `npm run lint`; keep production builds unblocked by style rules.
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
