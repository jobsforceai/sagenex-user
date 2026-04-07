"use client";

import { useEffect, useMemo, useState } from "react";

type Options = {
  maxPercent?: number;
  stepPercent?: number;
  intervalMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Simulates live-ticking price by adding small random variation.
 * Copied from sggold/user-frontend/lib/use-indicative-price.ts
 * to keep both apps consistent.
 */
export function useIndicativePrice(baseValue: number, options?: Options) {
  const maxPercent = options?.maxPercent ?? 0.5;
  const stepPercent = options?.stepPercent ?? 0.18;
  const intervalMs = options?.intervalMs ?? 2200;

  const [offsetPercent, setOffsetPercent] = useState(0);

  useEffect(() => {
    setOffsetPercent(0);
  }, [baseValue]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setOffsetPercent((prev) => {
        const delta = (Math.random() * 2 - 1) * stepPercent;
        return clamp(prev + delta, -maxPercent, maxPercent);
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, maxPercent, stepPercent]);

  const value = useMemo(() => {
    return baseValue * (1 + offsetPercent / 100);
  }, [baseValue, offsetPercent]);

  return {
    value,
    offsetPercent,
    isUp: offsetPercent >= 0,
  };
}
