import type { NextConfig } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8125/api/v1";
const API_ORIGIN = new URL(API_BASE_URL).origin;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The persistent dev cache made `next dev` extremely slow on this machine (minutes per write).
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Uploaded media lives on the Laravel API. Proxying /storage keeps image URLs
  // same-origin, so next/image optimises them like local files.
  async rewrites() {
    return [{ source: "/storage/:path*", destination: `${API_ORIGIN}/storage/:path*` }];
  },
};

export default nextConfig;
