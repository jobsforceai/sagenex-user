/**
 * PostHog product analytics — single source of truth.
 *
 * Client-only. Safe to import from server components (the init guards on
 * typeof window). Initialised once via PostHogProvider mounted in the root
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
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "always",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    // Mask all input contents by default to keep PII (OTP, password, phone) out of session replays.
    mask_all_text: false,
    mask_all_element_attributes: false,
    loaded: (ph) => {
      // Expose on window for browser-console debugging — AFTER init has finished
      // configuring persistence, consent, queue, etc. (doing it before init leaves
      // window.posthog as a half-built stub that throws on every method call).
      (window as unknown as { posthog?: typeof ph }).posthog = ph;
    },
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
      // Sample 25 % of sessions to stay under the 5K free-tier cap while still
      // capturing enough video for support cases.
      sampleRate: 0.25,
    },
  });
}

export function ph() {
  return posthog;
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialised) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined" || !initialised) return;
  posthog.reset();
}

/**
 * Strongly-typed wrapper for capture() so we keep event names consistent.
 * Add new event names here as they're introduced.
 */
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
