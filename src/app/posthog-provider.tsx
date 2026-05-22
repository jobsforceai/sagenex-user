"use client";

import { useEffect } from "react";
import { PostHogProvider as RawProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { POSTHOG_KEY, POSTHOG_HOST } from "@/lib/posthog";

/**
 * Wraps the app with the official PostHog React provider. Initialises
 * posthog-js once on the client. The provider handles teardown and
 * route-change tracking automatically.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !POSTHOG_KEY) return;
    if ((window as unknown as { __posthogInited?: boolean }).__posthogInited) return;
    (window as unknown as { __posthogInited?: boolean }).__posthogInited = true;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "always",
      capture_pageview: true,
      autocapture: true,
      loaded: (ph) => {
        // Expose AFTER init has finished — internal state (consent, queue) is ready now.
        (window as unknown as { posthog?: typeof ph }).posthog = ph;
      },
    });
  }, []);

  return <RawProvider client={posthog}>{children}</RawProvider>;
}
