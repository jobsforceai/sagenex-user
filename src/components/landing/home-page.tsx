"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import MagneticButton from "./magnetic-button";
import CityscapeIllustration from "./cityscape-illustration";

/* ── Data ─────────────────────────────────────── */

const HEADLINE_LINES = [
  { text: "Grow Your", green: false },
  { text: "Wealth with", green: false },
  { text: "Sagenex.", green: true },
];

const STATS = [
  { target: 12, suffix: "%+", label: "Avg Annual Returns", prefix: "" },
  { target: 50, suffix: "K+", label: "Active Members", prefix: "" },
  { target: 10, suffix: "M+", label: "Capital Deployed", prefix: "$" },
  { target: 8, suffix: "", label: "Investment Verticals", prefix: "" },
];

const TRUST = [
  "KYC Compliant",
  "Multi-sector Diversified",
  "Capped & Structured",
  "AI-Powered",
  "Transparent Payouts",
];

/* ── Mini bar chart ─────────────────────────────── */

function MiniBar() {
  const bars = [40, 58, 35, 72, 52, 85, 78];
  return (
    <div className="flex items-end gap-[3px] mt-3 h-7">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${h}%`,
            background: i === bars.length - 1 ? "#00b386" : "#00b38622",
          }}
        />
      ))}
    </div>
  );
}

/* ── Count-up hook ───────────────────────────── */

function useCountUp(target: number, duration = 1600, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return value;
}

function StatItem({ target, suffix, label, prefix }: (typeof STATS)[0]) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const value = useCountUp(target, 1600, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5 px-8 py-6">
      <span
        className="stat-number font-extrabold text-[#0a0a0a]"
        style={{ fontSize: "clamp(36px, 4.5vw, 60px)", letterSpacing: "-0.03em", lineHeight: 1 }}
      >
        {prefix}{value}{suffix}
      </span>
      <span className="text-[13px] font-medium text-[#888] text-center leading-snug">
        {label}
      </span>
    </div>
  );
}

/* ── Main component ──────────────────────────── */

export default function HomePage() {
  return (
    <div className="relative w-full min-h-screen bg-white overflow-hidden">

      {/* ── Top gradient wash ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,179,134,0.07) 0%, rgba(0,179,134,0.02) 60%, transparent 100%)",
        }}
      />

      {/* ── Animated blobs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="blob-1 absolute -top-32 -left-32 w-[800px] h-[800px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #00b386 0%, transparent 65%)" }}
        />
        <div
          className="blob-2 absolute -top-24 right-0 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #00b386 0%, transparent 65%)" }}
        />
        <div
          className="blob-3 absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #00b386 0%, transparent 65%)" }}
        />
      </div>

      {/* ── Floating card — left (returns) ── */}
      <motion.div
        className="absolute left-4 xl:left-[3.5%] top-[28%] hidden xl:block pointer-events-none z-10"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ animation: "float-card-a 5.2s ease-in-out 1.3s infinite" }}>
          <div
            className="w-[196px] rounded-2xl border border-[#ebebeb] bg-white/95 backdrop-blur-sm p-4"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#00b38614] flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00b386" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-[#bbb] tracking-widest uppercase">Returns</span>
            </div>
            <p className="text-[30px] font-extrabold text-[#0a0a0a] leading-none mb-0.5">12%+</p>
            <p className="text-[12px] text-[#00b386] font-semibold">Avg. annual return</p>
            <MiniBar />
          </div>
        </div>
      </motion.div>

      {/* ── Floating card — right (community) ── */}
      <motion.div
        className="absolute right-4 xl:right-[3.5%] top-[36%] hidden xl:block pointer-events-none z-10"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ animation: "float-card-b 6s ease-in-out 1.5s infinite" }}>
          <div
            className="w-[188px] rounded-2xl border border-[#ebebeb] bg-white/95 backdrop-blur-sm p-4"
            style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#6366f112] flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-[#bbb] tracking-widest uppercase">Community</span>
            </div>
            <p className="text-[30px] font-extrabold text-[#0a0a0a] leading-none mb-0.5">50K+</p>
            <p className="text-[12px] text-[#888] font-semibold mb-3">Active investors</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {["#00b386", "#6366f1", "#f97316", "#d97706"].map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-[1.5px] border-white shrink-0"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#bbb] font-medium">+49,996</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Hero content ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 pt-28 sm:pt-36 pb-16 sm:pb-20 flex flex-col items-center text-center">

        {/* Eyebrow with live indicator */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-center gap-3"
        >
          <span className="h-px w-8 bg-[#00b386]" />
          <span className="eyebrow">India&apos;s Most Trusted Wealth Ecosystem</span>
          <span className="h-px w-8 bg-[#00b386]" />
          <div className="flex items-center gap-1.5 bg-[#00b38610] border border-[#00b38628] px-2.5 py-1 rounded-full">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#00b386] block" />
            <span className="text-[9px] font-black text-[#00b386] tracking-[0.2em]">LIVE</span>
          </div>
        </motion.div>

        {/* Headline — per-line clip-path reveal */}
        <h1 className="display-headline mb-8">
          {HEADLINE_LINES.map((line, i) => (
            <span key={i} className="line-wrapper block">
              <motion.span
                initial={{ clipPath: "inset(100% 0 0 0)", opacity: 1 }}
                animate={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
                transition={{ duration: 0.72, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                className={`block ${line.green ? "text-shimmer" : ""}`}
              >
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.65 }}
          className="text-[18px] text-[#555] max-w-xl mb-10 leading-relaxed"
        >
          Where Artificial Intelligence meets Financial Precision.{" "}
          <span className="text-[#1a1a1a] font-semibold">
            Structured. Diversified. Transparent.
          </span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.78 }}
          className="flex flex-col sm:flex-row gap-3 items-center mb-20"
        >
          <MagneticButton>
            <Link href="/login">
              <button className="btn-cta-primary">
                Join the Revolution
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </Link>
          </MagneticButton>
          <MagneticButton>
            <Link href="#academy">
              <button className="btn-cta-secondary">Explore Packages</button>
            </Link>
          </MagneticButton>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.92 }}
          className="w-full max-w-4xl rounded-3xl border border-[#ebebeb] bg-white/80 backdrop-blur-sm shadow-[0_2px_40px_rgba(0,0,0,0.06)] divide-x divide-[#ebebeb] flex flex-wrap justify-center"
        >
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </motion.div>
      </div>

      {/* ── Trust strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.05 }}
        className="border-t border-[#ebebeb] bg-[#fafafa] py-3.5"
      >
        <div className="mx-auto max-w-7xl px-6 flex flex-wrap justify-center gap-6 sm:gap-10">
          {TRUST.map((item) => (
            <span key={item} className="text-[12px] font-medium text-[#999] whitespace-nowrap tracking-wide">
              <span className="text-[#00b386] mr-1.5">✓</span>{item}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── Animated cityscape ── */}
      <CityscapeIllustration />
    </div>
  );
}
