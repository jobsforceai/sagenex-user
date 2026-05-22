/**
 * PostHog wrapper — single source of truth for analytics.
 *
 * Uses the official posthog-js/react integration. The PostHogProvider
 * (in src/app/posthog-provider.tsx) handles init via React context so
 * the SDK isn't bundled in a way that breaks its internal state in
 * Next.js 16 Turbopack builds.
 */
"use client";

import { usePostHog } from "posthog-js/react";
import posthog from "posthog-js";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined") return;
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
  if (typeof window === "undefined") return;
  posthog.capture(event, props);
}

// Re-export for components that prefer the hook
export { usePostHog };
