"use client";

import { useEffect } from "react";
import { initPosthog } from "@/lib/posthog";

/**
 * Client-only provider that initialises PostHog exactly once when the app
 * mounts. Lives in the root layout (server component) so this runs on every
 * page without re-initialising.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { initPosthog(); }, []);
  return <>{children}</>;
}
