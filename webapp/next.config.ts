import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Proxy all /twedot-api/* requests server-side to the backend.
  // This avoids browser CORS entirely — the Go upload service and any other
  // route are all reached through the same Next.js origin.
  async redirects() {
    return [
      { source: "/feed", destination: "/stories", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/twedot-api/:path*",
        destination: "https://prodapi.twedot.com/:path*",
      },
    ];
  },
};

export default nextConfig;
