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
    <section className="relative min-h-screen overflow-hidden bg-[#F8FAFC] pt-[7.75rem] text-[#0F172A] sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_9%_24%,rgba(200,16,62,0.08),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(5,150,105,0.10),transparent_29%),linear-gradient(180deg,#ffffff_0%,#F8FAFC_74%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute right-0 top-20 h-[520px] w-[58vw] opacity-[0.09] bg-[radial-gradient(#0F172A_1px,transparent_1px)] bg-size-[10px_10px] mask-[radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[460px] w-[46vw] bg-[linear-gradient(90deg,transparent,rgba(5,150,105,0.08),rgba(200,16,62,0.08))] [clip-path:polygon(58%_0,100%_0,100%_100%,0_100%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="grid flex-1 items-center gap-8 pb-12 sm:gap-10 sm:pb-24 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1fr)]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center sm:mx-0 sm:text-left"
          >
            <div className="relative z-10 inline-flex max-w-full items-center gap-2 rounded-full border border-[#C8103E]/20 bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#A50D33] shadow-[0_8px_22px_rgba(15,23,42,0.07)] min-[380px]:text-[11px] sm:text-xs">
              <Image src="/logo5.png" alt="" width={18} height={18} className="h-4 w-4 object-contain" />
              <span className="truncate">A Civilization of Heritage & Innovation</span>
            </div>

            <h1 className="mx-auto mt-5 max-w-none text-[clamp(1.78rem,7.55vw,2rem)] font-black leading-[1.04] tracking-tight min-[380px]:text-[clamp(1.86rem,7.65vw,2.08rem)] sm:mx-0 sm:mt-7 sm:text-6xl sm:leading-[0.96] lg:text-7xl">
              <span className="block whitespace-nowrap">Building a Legacy</span>
              <span className="block whitespace-nowrap text-[#C8103E] sm:text-inherit">
                Empowering <span className="text-[#0F172A] sm:block">Generations</span>
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[34rem] text-sm font-semibold leading-6 text-slate-600 min-[380px]:text-[15px] min-[380px]:leading-7 sm:mx-0 sm:mt-6 sm:text-lg sm:leading-8">
              At Sagenex, we blend trust, technology, and vision to create impact that lasts. Together, we grow, we evolve, and we lead.
            </p>

            <div className="mx-auto mt-7 grid w-full max-w-[18rem] grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:mx-0 sm:mt-8 sm:flex sm:max-w-none sm:flex-wrap sm:gap-4">
              <Link
                href="#ecosystem"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C8103E] px-3 text-[13px] font-black text-white shadow-[0_16px_35px_rgba(200,16,62,0.24)] transition hover:-translate-y-0.5 hover:bg-[#A50D33] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30 sm:h-14 sm:px-7 sm:text-sm"
              >
                <span className="sm:hidden">Explore</span>
                <span className="hidden sm:inline">Explore Ecosystem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#about"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-black text-[#0F172A] shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20 sm:h-14 sm:gap-3 sm:px-6 sm:text-sm"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 sm:h-9 sm:w-9">
                  <Play className="h-4 w-4 fill-[#C8103E] text-[#C8103E]" />
                </span>
                <span className="sm:hidden">Overview</span>
                <span className="hidden sm:inline">Watch Overview</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[500px]"
            aria-label="Sagenex heritage and innovation visual."
          >
            <div className="absolute inset-x-10 bottom-11 h-24 rounded-full bg-slate-900/10 blur-2xl" />
            <div className="absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_50%_52%,rgba(200,16,62,0.08),transparent_28%),radial-gradient(circle_at_44%_44%,rgba(5,150,105,0.12),transparent_30%)]" />
            <div className="absolute inset-x-8 bottom-12 h-24 rounded-[100%] border border-slate-200/70 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)]" />
            <div className="relative flex h-full min-h-[260px] items-center justify-center px-2 py-4 sm:min-h-[340px] sm:px-4 sm:py-6 lg:min-h-[500px]">
              {/*
                Video hero temporarily disabled.
                Restore this block when we want hover-play again:
                <video src="/hero.mp4" muted loop playsInline preload="metadata" />
              */}
              <div className="relative z-10 w-full max-w-[560px] rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#FDFDFC_46%,#F3F5F7_100%)] p-3 shadow-[0_22px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/40 sm:max-w-[660px] sm:rounded-[2.35rem] sm:p-5">
                <Image
                  src="/hero.png"
                  alt="Sagenex heritage and innovation emblem"
                  width={680}
                  height={520}
                  priority
                  className="relative z-10 max-h-[230px] w-full object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.16)] sm:max-h-[410px]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16 }}
          className="relative z-10 mt-2 rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.09)] backdrop-blur sm:-mt-20 sm:p-5"
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

        <div className="hidden justify-center pb-5 pt-10 text-sm font-semibold text-[var(--landing-text-muted)] sm:flex">
          <span className="inline-flex items-center gap-2 animate-bounce">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M8 2v12M4 10l4 4 4-4" />
            </svg>
            Scroll to explore
          </span>
        </div>
      </div>
    </section>
  );
}
