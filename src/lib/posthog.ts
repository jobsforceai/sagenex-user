/**
 * Analytics wrapper using PostHog loaded via the HTML bootstrap snippet
 * (see src/app/posthog-provider.tsx). The SDK lives on window.posthog;
 * we never import posthog-js at module-scope so there's no bundler hazard.
 */
"use client";

type PostHogClient = {
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: () => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
};

function ph(): PostHogClient | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { posthog?: PostHogClient }).posthog;
  return c ?? null;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  ph()?.identify(userId, traits);
}

export function resetUser() {
  ph()?.reset();
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
  ph()?.capture(event, props);
}
