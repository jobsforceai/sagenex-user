"use client";

import * as amplitude from "@amplitude/unified";

const AMPLITUDE_API_KEY =
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ||
  "a07f3e5d10d17a093e31ad7507382f86";

let initPromise: Promise<void> | null = null;

export function initAmplitude() {
  if (typeof window === "undefined" || !AMPLITUDE_API_KEY) return null;

  if (!initPromise) {
    initPromise = amplitude.initAll(AMPLITUDE_API_KEY, {
      analytics: {
        autocapture: true,
      },
      sessionReplay: {
        sampleRate: 1,
      },
    });
  }

  return initPromise;
}

export function identifyAmplitudeUser(userId: string) {
  const ready = initAmplitude();
  if (!ready) return;

  void ready.then(() => {
    amplitude.setUserId(userId);
  });
}

export function resetAmplitudeUser() {
  const ready = initAmplitude();
  if (!ready) return;

  void ready.then(() => {
    amplitude.reset();
  });
}

export function trackAmplitude(event: string, props?: Record<string, unknown>) {
  const ready = initAmplitude();
  if (!ready) return;

  void ready.then(() => {
    amplitude.track(event, props);
  });
}
