import type { MetadataRoute } from "next";

const baseUrl = "https://sgxmeta.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    "/",
    "/dashboard",
    "/wallet",
    "/swap",
    "/token",
    "/docs",
    "/withdraw",
    "/profile",
    "/kyc",
    "/login",
    "/register",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
  }));
}
