/**
 * PostHog product analytics — single source of truth.
 *
 * Client-only. Initialised once via PostHogProvider mounted in the root
 * layout. Authenticated users are tied via `identify(userId)` inside
 * AuthContext after login.
 */
"use client";

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialised = false;

export function initPosthog() {
  if (typeof window === "undefined") return;
  if (initialised || !POSTHOG_KEY) return;
  initialised = true;
  // Keep config minimal — extra options have caused silent init failures
  // (consent / __loaded internals breaking) in v1.375. Add back as needed.
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "always",
    capture_pageview: true,
    autocapture: true,
    loaded: (ph) => {
      (window as unknown as { posthog?: typeof ph }).posthog = ph;
    },
  });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialised) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined" || !initialised) return;
  posthog.reset();
}

export type AnalyticsEvent =
  | "team_pulse_call_clicked"
  | "team_pulse_whatsapp_clicked"
  | "team_pulse_action_clicked"
  | "team_pulse_action_call_clicked"
  | "team_pulse_action_whatsapp_clicked"
  | "tree_node_action_bar_opened"
  | "tree_node_call_clicked"
  | "tree_node_whatsapp_clicked"
  | "tree_search_executed"
  | "dashboard_loaded"
  | "team_loaded";

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialised) return;
  posthog.capture(event, props);
}
