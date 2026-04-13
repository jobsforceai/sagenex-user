"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);

const HEADLINE_WORDS = ["Grow", "Your", "Wealth", "with", "Sagenex"];

const STATS = [
  { target: 12, suffix: "%+", label: "Avg Annual Returns", prefix: "" },
  { target: 50, suffix: "K+", label: "Active Members", prefix: "" },
  { target: 8, suffix: "", label: "Investment Verticals", prefix: "" },
  { target: 10, suffix: "M+", label: "Capital Deployed (USD)", prefix: "$" },
];

function useCountUp(target: number, duration = 1600, started: boolean = false) {
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

function StatCounter({ target, suffix, label, prefix }: typeof STATS[0]) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const value = useCountUp(target, 1400, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 px-8 py-4">
      <div className="stat-number text-3xl sm:text-4xl font-extrabold text-[#1a1a1a]">
        {prefix}{value}{suffix}
      </div>
      <div className="text-sm text-[#666] font-medium text-center">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const cityscapeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cityscapeRef.current) return;
    gsap.to(cityscapeRef.current, {
      yPercent: -18,
      ease: "none",
      scrollTrigger: {
        trigger: cityscapeRef.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
      },
    });
  }, { scope: cityscapeRef });

  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Subtle radial glow behind headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-40"
        style={{
          background: "radial-gradient(60% 60% at 50% 0%, rgba(0,179,134,0.12), transparent 70%)",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-10 sm:pt-28 sm:pb-16 flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e6f7f3] border border-[#00b386]/30 px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-[#00b386] animate-pulse" />
          <span className="text-sm font-semibold text-[#00875f]">India's Most Trusted Wealth Ecosystem</span>
        </motion.div>

        {/* Animated headline */}
        <h1 className="text-[clamp(36px,6vw,80px)] font-extrabold leading-[1.1] tracking-tight text-[#1a1a1a] mb-6">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={word + i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block mr-[0.25em] ${word === "Sagenex" ? "text-[#00b386]" : ""}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-lg sm:text-xl text-[#555] max-w-2xl mb-10 leading-relaxed"
        >
          Where Artificial Intelligence Meets Financial Precision.{" "}
          <span className="text-[#1a1a1a] font-semibold">Structured. Diversified. Transparent.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-4 items-center mb-16"
        >
          <Link href="/login">
            <button className="btn-groww text-base px-7 py-3">
              Join the Revolution
            </button>
          </Link>
          <Link href="#academy">
            <button className="btn-groww-outline text-base px-7 py-3">
              Explore Packages
            </button>
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="w-full max-w-4xl rounded-2xl border border-[#e8e8e8] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.07)] divide-x divide-[#e8e8e8] flex flex-wrap"
        >
          {STATS.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </motion.div>
      </div>

      {/* Cityscape parallax */}
      <div className="relative w-full h-64 sm:h-80 overflow-hidden mt-4">
        <div ref={cityscapeRef} className="absolute inset-x-0 bottom-0 w-full will-change-transform">
          <Image
            src="/cityScape.svg"
            alt="City skyline"
            width={1440}
            height={320}
            className="w-full object-cover object-bottom"
            priority
            style={{ filter: "hue-rotate(140deg) saturate(0.6) brightness(1.1)" }}
          />
        </div>
        {/* Green gradient overlay blending cityscape into next section */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to top, #f7f8fa, transparent)" }}
        />
      </div>
    </div>
  );
}
