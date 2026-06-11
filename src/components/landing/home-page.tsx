"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Box, Headphones, Play, ShieldCheck, Users } from "lucide-react";

const stats = [
  { icon: Box, value: "5+", label: "Ecosystem Products", tone: "green" as const },
  { icon: Users, value: "100K+", label: "Global Community", tone: "red" as const },
  { icon: ShieldCheck, value: "1M+", label: "Transactions Secured", tone: "green" as const },
  { icon: Headphones, value: "24/7", label: "Dedicated Support", tone: "red" as const },
];

export default function HomePage() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-24 sm:pt-28 lg:pt-32">
      {/* Background decoration */}
      {/* <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[15%] -top-[10%] h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(200,16,62,0.06)_0%,transparent_65%)]" />
        <div className="absolute -right-[10%] top-[15%] h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(0,179,134,0.07)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--landing-border-light)] to-transparent" />
      </div> */}

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col px-5 sm:px-6 lg:px-8">
        {/* Main content — stacked mobile, side-by-side desktop */}
        <div className="grid flex-1 items-center gap-8 pb-8 text-center lg:grid-cols-[1fr_minmax(400px,1fr)] lg:gap-12 lg:pb-20 lg:text-left">
          {/* Text block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl pt-4 lg:mx-0 lg:pt-0"
          >
            {/* Badge */}
            <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-[#C8103E]/12 bg-white px-3.5 py-1.5 text-[11px] font-extrabold tracking-wide text-[#A50D33] shadow-sm lg:mx-0">
              <Image src="/logo5.png" alt="" width={18} height={18} className="h-4 w-4 object-contain" />
              <span className="truncate">A Civilization of Heritage & Innovation</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 font-display text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tight text-[var(--landing-text-dark)]">
              Building a Legacy
              <span className="block text-[#C8103E]">Empowering</span>
              <span className="block">Generations</span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-medium leading-7 text-[var(--landing-text-muted)] sm:text-base sm:leading-8 lg:mx-0">
              At Sagenex, we blend trust, technology, and vision to create impact that lasts. Together, we grow, we evolve, and we lead.
            </p>

            {/* CTAs */}
            <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:flex-row sm:justify-center sm:gap-4 lg:mx-0 lg:justify-start">
              <Link
                href="#ecosystem"
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#C8103E] px-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(200,16,62,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#A50D33] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30 active:scale-[0.98] sm:h-13 sm:gap-2.5 sm:px-7"
              >
                <span className="sm:hidden">Explore</span>
                <span className="hidden sm:inline">Explore Ecosystem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#about"
                className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-2xl border border-[var(--landing-border-light)] bg-white px-3 text-sm font-extrabold text-[var(--landing-text-dark)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/15 active:scale-[0.98] sm:h-13 sm:gap-3 sm:px-6"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[var(--landing-border-light)] bg-[#FFF1F4] sm:h-9 sm:w-9">
                  <Play className="h-3 w-3 fill-[#C8103E] text-[#C8103E] sm:h-3.5 sm:w-3.5" />
                </span>
                <span className="sm:hidden">Overview</span>
                <span className="hidden sm:inline">Watch Overview</span>
              </Link>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mx-auto flex w-full max-w-[540px] items-center justify-center lg:mx-0 lg:max-w-none"
            aria-label="Sagenex heritage and innovation visual."
          >
            {/* Shadow */}
            <div className="absolute inset-x-8 bottom-6 h-16 rounded-full bg-slate-900/8 blur-2xl lg:bottom-8 lg:h-20" />
            <Image
              src="/hero.png"
              alt="Sagenex heritage and innovation emblem"
              width={680}
              height={520}
              priority
              className="relative z-10 max-h-[280px] w-full object-contain sm:max-h-[360px] lg:max-h-[420px]"
            />
          </motion.div>
        </div>

        {/* Stats bar — snap-scroll on mobile, grid on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="relative z-10 -mt-4 mb-6 rounded-[var(--landing-radius-lg)] border border-[var(--landing-border-light)] bg-white/95 p-3 shadow-[0_14px_40px_rgba(15,23,42,0.07)] backdrop-blur sm:p-4 lg:-mt-14 lg:mb-0"
        >
          <div className="grid grid-cols-4 gap-1 sm:gap-3">
            {stats.map(({ icon: Icon, value, label, tone }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3.5 rounded-2xl px-1 py-2 sm:px-4 sm:py-3.5 lg:border-r lg:border-[var(--landing-border-light)] lg:last:border-r-0"
              >
                <span className={`grid h-9 w-9 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl ${tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-[#FFF1F4] text-[#C8103E]"}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div>
                  <p className={`text-[15px] sm:text-xl font-black leading-none sm:leading-tight ${tone === "green" ? "text-emerald-600" : "text-[#C8103E]"}`}>{value}</p>
                  <p className="text-[9px] sm:text-[13px] font-semibold text-[var(--landing-text-muted)] leading-tight mt-1 sm:mt-0 max-w-[70px] sm:max-w-none mx-auto sm:mx-0">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scroll hint — desktop only */}
        <div className="hidden justify-center pb-5 pt-10 text-sm font-semibold text-[var(--landing-text-muted)] sm:flex">
          <span className="inline-flex items-center gap-2 animate-bounce">
            <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M4 10l4 4 4-4" /></svg>
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
