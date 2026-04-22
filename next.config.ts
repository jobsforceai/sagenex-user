import type { NextConfig } from "next";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const apiBaseUrl = backendBaseUrl.endsWith("/api")
  ? backendBaseUrl
  : `${backendBaseUrl.replace(/\/$/, "")}/api`;

const autoproctorOrigin = process.env.AUTOPROCTOR_ORIGIN;
const frameAncestors = ["'self'", autoproctorOrigin].filter(Boolean).join(" ");
const frameAncestorsPolicy = `frame-ancestors ${frameAncestors};`;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: "/tests/online",
        headers: [
          {
            key: "Content-Security-Policy",
            value: frameAncestorsPolicy,
          },
        ],
      },
      {
        source: "/login",
        headers: [
          {
            key: "Content-Security-Policy",
            value: frameAncestorsPolicy,
          },
        ],
      },
    ];
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
