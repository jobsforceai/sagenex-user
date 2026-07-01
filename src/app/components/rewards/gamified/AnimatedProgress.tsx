"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useId, useState } from "react";
import { REWARDS } from "./rewards-theme";

type ProgressVariant = "crimson" | "rose" | "white";

const FILL: Record<ProgressVariant, string> = {
  crimson: "bg-[#C41E3A]",
  rose: "bg-[#E85D75]",
  white: "bg-white",
};

type AnimatedProgressBarProps = {
  value: number;
  variant?: ProgressVariant;
  size?: "xs" | "sm" | "md";
  delay?: number;
  trackClassName?: string;
  className?: string;
};

const HEIGHT = { xs: "h-1.5", sm: "h-2", md: "h-2.5" };

export function AnimatedProgressBar({
  value,
  variant = "crimson",
  size = "sm",
  delay = 0,
  trackClassName = "bg-[#E2E8F0]",
  className = "",
}: AnimatedProgressBarProps) {
  const motionValue = useMotionValue(0);
  const width = useTransform(motionValue, (v) => `${Math.min(100, Math.max(0, v))}%`);
  const clamped = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const controls = animate(motionValue, clamped, {
      duration: 0.85,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [clamped, delay, motionValue]);

  return (
    <div
      className={`relative overflow-hidden rounded-full ${HEIGHT[size]} ${trackClassName} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${FILL[variant]}`}
        style={{ width }}
      />
    </div>
  );
}

type AnimatedProgressRingProps = {
  percent: number;
  size?: number;
  delay?: number;
  variant?: "light" | "dark";
};

export function AnimatedProgressRing({
  percent,
  size = 100,
  delay = 0.15,
  variant = "dark",
}: AnimatedProgressRingProps) {
  const gradId = useId();
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const [display, setDisplay] = useState(0);
  const onDark = variant === "dark";

  useEffect(() => {
    const controls = animate(0, clamped, {
      duration: 0.85,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [clamped, delay]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div
      className={`relative shrink-0 rounded-full ${onDark ? "" : "bg-white p-1 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"}`}
      style={{ width: size + (onDark ? 0 : 8), height: size + (onDark ? 0 : 8) }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={onDark ? "#ffffff" : REWARDS.crimson} />
            <stop offset="100%" stopColor={onDark ? "#F4B4C4" : REWARDS.crimsonDark} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={onDark ? "rgba(255,255,255,0.25)" : "#E2E8F0"}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display text-2xl font-black ${onDark ? "text-white" : "text-[#0F172A]"}`}
        >
          {display}%
        </span>
        <span
          className={`text-[9px] font-bold uppercase tracking-widest ${onDark ? "text-white/70" : "text-[#64748B]"}`}
        >
          done
        </span>
      </div>
    </div>
  );
}

export function AnimatedPercent({
  value,
  className = "",
  delay = 0.2,
}: {
  value: number;
  className?: string;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.75,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, delay]);

  return <span className={className}>{display}%</span>;
}

type HeroQuestProgressProps = {
  percent: number;
  keysDone: number;
  keysTotal: number;
  delay?: number;
  compact?: boolean;
};

/** Single standout progress — clean bar, crimson only */
export function HeroQuestProgress({
  percent,
  keysDone,
  keysTotal,
  delay = 0.1,
  compact = false,
}: HeroQuestProgressProps) {
  const motionValue = useMotionValue(0);
  const width = useTransform(motionValue, (v) => `${Math.min(100, Math.max(0, v))}%`);
  const clamped = Math.min(100, Math.max(0, percent));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionValue, clamped, {
      duration: 1,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [clamped, delay, motionValue]);

  return (
    <div
      className={`rounded-2xl border border-[#E2E8F0] bg-white ${
        compact ? "p-3.5" : "p-4"
      }`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">Overall progress</p>
          <p className="mt-1 text-sm text-[#475569]">
            <span className="font-bold text-[#0F172A]">{keysDone}</span>
            <span className="mx-1">of</span>
            <span className="font-bold text-[#0F172A]">{keysTotal}</span>
            <span className="ml-1">requirements</span>
          </p>
        </div>
        <div className="text-right">
          <span
            className={`font-display font-black leading-none text-[#0F172A] tabular-nums ${
              compact ? "text-3xl" : "text-4xl"
            }`}
          >
            {display}
            <span className={compact ? "text-xl text-[#94A3B8]" : "text-2xl text-[#94A3B8]"}>%</span>
          </span>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-full bg-[#E2E8F0] ${compact ? "mt-3 h-2.5" : "mt-4 h-3"}`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#9d122f] via-[#C41E3A] to-[#E85D75]"
          style={{ width }}
        />
      </div>
    </div>
  );
}
