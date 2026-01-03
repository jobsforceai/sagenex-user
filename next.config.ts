import type { NextConfig } from "next";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const apiBaseUrl = backendBaseUrl.endsWith("/api")
  ? backendBaseUrl
  : `${backendBaseUrl.replace(/\/$/, "")}/api`;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
