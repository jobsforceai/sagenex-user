// components/InvestorVsLeader.tsx
"use client";

import { motion } from "framer-motion";
import { Coins, Crown, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" aria-hidden />
    <span className="text-[14px] leading-6 text-white/85">{children}</span>
  </li>
);

export default function InvestorVsLeader() {
  return (
    <section className="relative overflow-hidden text-white">
      
      
      
      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Investor <span className={`text-transparent bg-clip-text bg-gradient-to-r ${GOLD}`}>&nbsp;vs&nbsp;</span> Business Leader
          </h2>
          <p className="mt-2 text-white/70">SAGENEX Earnings Model</p>
        </motion.header>

        {/* Creative shimmer divider */}
        <div className="relative mx-auto mt-6 h-[2px] w-52 overflow-hidden rounded-full bg-white/10">
          <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-sm animate-[shine_2.2s_ease-in-out_infinite]" />
          <style jsx>{`
            @keyframes shine { 
              0% { transform: translateX(0); opacity:.2 }
              60% { opacity:.5 }
              100% { transform: translateX(330%); opacity:0 }
            }
          `}</style>
        </div>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Investor */}
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45 }}
            className="group relative overflow-hidden rounded-2xl border border-yellow-300/10 bg-gradient-to-b from-[#07140E] to-[#0B1913] p-6 backdrop-blur-md shadow-lg"
          >
            {/* soft decorative backgrounds */}
            <div className="pointer-events-none absolute inset-0 -z-10">
              
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-yellow-400/8 blur-2xl" />
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-500/15 p-2 ring-1 ring-yellow-300/30">
                <Coins className="h-6 w-6 text-yellow-300" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold">
                Investor <span className="text-white/60 text-sm align-middle">(Passive)</span>
              </h3>
            </div>

            <ul className="mt-4 space-y-2">
              <Bullet>Earns only through ROI from investment pools.</Bullet>
              <Bullet>Maximum Return capped at <span className="font-semibold">2.5×</span> of capital.</Bullet>
              <Bullet>Example: <span className="font-semibold">$1,000 → $2,500</span></Bullet>
              <Bullet>Must <span className="font-semibold">re-invest</span> to continue earning after cap is reached.</Bullet>
            </ul>

            {/* CTA */}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="#packages"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
              >
                Start as Investor <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {/* decorative border accent */}
            {/* <span className={`pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r ${GOLD}`} /> */}
          </motion.article>

          {/* Business Leader */}
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-yellow-300/14 bg-gradient-to-b from-[#072116] to-[#07120f] p-6 backdrop-blur-md shadow-xl"
          >
            <div className="pointer-events-none absolute inset-0 -z-10">
              
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-yellow-300/7 blur-3xl" />
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-yellow-500/20 p-2 ring-1 ring-yellow-300/30">
                <Crown className="h-6 w-6 text-yellow-300" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold">
                Business Leader <span className="text-white/60 text-sm align-middle">(Active)</span>
              </h3>
            </div>

            <ul className="mt-4 space-y-2">
              <Bullet>
                Earns through ROI <span className="font-semibold">+ Direct Bonus + Unilevel + 8-Way Incentives</span>.
              </Bullet>
              <Bullet>Maximum Return capped at <span className="font-semibold">4×</span> of capital.</Bullet>
              <Bullet>Example: <span className="font-semibold">$1,000 → $4,000</span></Bullet>
              <Bullet>Must <span className="font-semibold">re-invest & maintain team activity</span> to continue.</Bullet>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href="#leader"
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black bg-gradient-to-r ${GOLD} hover:brightness-95 active:brightness-90`}
              >
                Become a Business Leader <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="#packages" className="text-sm text-white/80 underline decoration-white/30 hover:decoration-white">
                View packages
              </Link>
            </div>

            {/* <span className={`pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r ${GOLD}`} /> */}
          </motion.article>
        </div>

        {/* Compact comparison strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
          className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="grid grid-cols-1 gap-3 text-sm text-white/80 md:grid-cols-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/60">Cap:</span>
              <span className="font-semibold">Investor 2.5×</span>
              <span className="text-white/40">|</span>
              <span className="font-semibold">Leader 4×</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/60">Earnings:</span>
              <span className="font-semibold">ROI only</span>
              <span className="text-white/40">→</span>
              <span className="font-semibold">ROI + Bonuses + Unilevel</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-white/60">Requirement:</span>
              <span className="font-semibold">Re-invest</span>
              <span className="text-white/40">|</span>
              <span className="font-semibold">Re-invest + Team Activity</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none h-14 w-full bg-gradient-to-b from-transparent to-black/60" />
    </section>
  );
}
