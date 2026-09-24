import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.thedesirelounge.com" },
      { protocol: "https", hostname: "restaurents-api.cylsys.com", pathname: "/**" },

    ],
  },
  // Dev-only proxy so localhost calls are same-origin (no CORS preflight).
  // Rewrites are ignored by `next build` with output: "export", so production
  // keeps hitting the API directly.
  ...(isDev
    ? {
        async rewrites() {
          return [
            {
              source: "/live-sports-api/:path*",
              destination: "https://restaurents-api.cylsys.com/:path*",
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;