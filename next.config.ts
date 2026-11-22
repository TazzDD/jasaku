import type { NextConfig } from "next";
const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },devIndicators: false,
};
export default config;
