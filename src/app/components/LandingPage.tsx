"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Box, Headphones, Mouse, Play, ShieldCheck, Users } from "lucide-react";
import CashCardSection from "../../components/landing/cash-card";
import SagenexAcademy from "@/components/landing/sagenex-academy";


/**
 * SAGENEX Landing Page + common static pages (non‑functional)
 * -----------------------------------------------------------
 * - TailwindCSS + Framer Motion
 * - Minimal client‑only motion (SSR‑safe)
 * - Sections:
 *   1) Hero
 *   2) Trust/Ribbon KPIs
 *   3) Sagenex Academy (tiers)
 *   4) Referral & Unilevel snapshot
 *   5) Compliance / KYC (Sagenex Passport)
 *   6) Cash Card highlight
 *   7) Roadmap / Timeline
 *   8) Legal disclaimer bar
 *   9) Footer with quick links
 * - Also exports light placeholder sections for /about-us, /timeline, /levels, /package
 *
 * NOTE: Hook up real routes by placing each exported component into separate files under app/.
 * For quick preview, you can render <LandingPage/> directly in app/page.tsx.
 */



const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const glass =
  "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_10px_50px_rgba(0,0,0,0.35)]";

// Small helpers
const Section: React.FC<React.PropsWithChildren<{ id?: string; className?: string; }>> = ({ id, className, children }) => (
  <section id={id} className={`relative py-20 ${className ?? ""}`}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(2s55,255,255,0.06),rgba(255,255,255,0)_70%)]"/>
    <div className={container}>{children}</div>
  </section>
);

type BadgeTone = "emerald" | "violet" | "zinc";

const Badge: React.FC<React.PropsWithChildren<{ tone?: BadgeTone }>> = ({ tone = "emerald", children }) => (
  <span
    className={`inline-flex h-10 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
      tone === "emerald"
        ? "bg-emerald-400/10 text-emerald-200 ring-emerald-400/30"
        : tone === "violet"
        ? "bg-violet-400/10 text-violet-200 ring-violet-400/30"
        : "bg-white/5 text-zinc-200 ring-white/15"
    }`}
  >
    {children}
  </span>
);

// ---- 1) HERO ----
export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#050505] text-white">
      {/* Top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-white/60 to-transparent"/>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#F8FAFC] pt-24 text-[#0F172A] sm:pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_20%,rgba(200,16,62,0.08),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(5,150,105,0.10),transparent_28%)]" />
        <div className="pointer-events-none absolute right-0 top-16 h-[520px] w-[58vw] opacity-[0.08] [background-image:radial-gradient(#0F172A_1px,transparent_1px)] [background-size:10px_10px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className={`${container} relative`}>
          <div className="grid min-h-[560px] items-center gap-10 pb-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1fr)]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C8103E]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#A50D33] shadow-sm">
                <Image src="/logo5.png" alt="" width={18} height={18} className="h-4 w-4 object-contain" />
                A Civilization of Heritage & Innovation
              </div>
              <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Building a Legacy
                <span className="block text-[#C8103E]">Empowering</span>
                <span className="block">Generations</span>
              </h1>
              <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
                At Sagenex, we blend trust, technology, and vision to create impact that lasts. Together, we grow, we evolve, and we lead.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="#academy"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#C8103E] px-7 text-sm font-black text-white shadow-[0_16px_35px_rgba(200,16,62,0.24)] transition hover:-translate-y-0.5 hover:bg-[#A50D33] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30"
                >
                  Explore Ecosystem
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#plan"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-[#0F172A] shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200">
                    <Play className="h-4 w-4 fill-[#C8103E] text-[#C8103E]" />
                  </span>
                  Watch Overview
                </Link>
              </div>
            </motion.div>

            <HeroVideo />
          </div>

          <div className="relative z-10 -mb-11 rounded-[1.75rem] border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_55px_rgba(15,23,42,0.09)] backdrop-blur sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Box, value: "5+", label: "Ecosystem Products", tone: "emerald" },
                { icon: Users, value: "100K+", label: "Global Community", tone: "crimson" },
                { icon: ShieldCheck, value: "1M+", label: "Transactions Secured", tone: "emerald" },
                { icon: Headphones, value: "24/7", label: "Dedicated Support", tone: "crimson" },
              ].map(({ icon: Icon, value, label, tone }) => (
                <div key={label} className="flex items-center gap-4 rounded-2xl px-4 py-4 lg:border-r lg:border-slate-200/70 last:lg:border-r-0">
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tone === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-[#FFF1F4] text-[#C8103E]"}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className={`text-2xl font-black ${tone === "emerald" ? "text-emerald-700" : "text-[#C8103E]"}`}>{value}</p>
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden justify-center pb-5 pt-20 text-sm font-semibold text-slate-500 sm:flex">
            <span className="inline-flex items-center gap-2">
              <Mouse className="h-5 w-5" />
              Scroll to explore
            </span>
          </div>
        </div>
      </section>

      {/* 2) RIBBON / TRUST KPIs */}
      <div className="border-y border-white/10 bg-white/5">
        <div className={`${container} grid grid-cols-2 md:grid-cols-4 gap-6 py-6 text-center`}>
          {[
            { k: "Global", v: "10+ Countries" },
            { k: "Academy", v: "9 Tracks" },
            { k: "Compliance", v: "KYC · AML" },
            { k: "Cards", v: "Global Cash Card" },
          ].map((i) => (
            <div key={i.k} className="flex flex-col items-center">
              <span className="text-xs uppercase tracking-widest text-zinc-400">{i.k}</span>
              <span className="mt-1 text-lg font-semibold">{i.v}</span>
            </div>
          ))}
        </div>
      </div>

<Section id="academy">

      <SagenexAcademy />
</Section>

      {/* 4) Unilevel Plan Snapshot */}
      <PlanSection />

      {/* 5) KYC / Passport */}
      <PassportSection />

      {/* 6) Cash Card */}
      <CashCardSection />

      {/* 7) Timeline */}
      <TimelineSection />

      {/* 8) Legal bar */}
      <LegalStrip />

      {/* 9) Footer */}
      <Footer />
    </main>
  );
}

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => undefined);
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 }}
      className="relative min-h-[360px] lg:min-h-[500px]"
      onMouseEnter={playVideo}
      onMouseLeave={pauseVideo}
      onFocus={playVideo}
      onBlur={pauseVideo}
      tabIndex={0}
      aria-label="Sagenex heritage and innovation visual. Hover or focus to play video."
    >
      <div className="absolute inset-x-8 bottom-8 h-24 rounded-full bg-slate-900/10 blur-2xl" />
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_52%,rgba(200,16,62,0.09),transparent_28%),radial-gradient(circle_at_44%_44%,rgba(5,150,105,0.12),transparent_30%)]" />
      <div className="absolute inset-x-6 bottom-10 h-24 rounded-[100%] border border-slate-200/70 bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)]" />
      <div className="relative flex h-full min-h-[360px] items-center justify-center lg:min-h-[500px]">
        <video
          ref={videoRef}
          src="/hero.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          className="relative z-10 max-h-[440px] w-full max-w-[620px] object-contain drop-shadow-[0_28px_45px_rgba(15,23,42,0.20)]"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

// ---- CTA ----
function CTA({ href, label, variant = "primary" }: { href: string; label: string; variant?: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white/90 hover:text-white ring-1 ring-white/20 hover:ring-white/30 bg-white/5 hover:bg-white/10"
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_30px_rgba(99,102,241,0.45)] bg-gradient-to-b from-violet-500 to-violet-600 hover:from-violet-500/95 hover:to-violet-600/95"
    >
      {label}
    </Link>
  );
}

// ---- Academy ----




// ---- Plan Snapshot ----
function PlanSection() {
  const rows = [
    { level: 1, pct: 10, example: 100 },
    { level: 2, pct: 6, example: 60 },
    { level: 3, pct: 5, example: 50 },
    { level: 4, pct: 4, example: 40 },
    { level: 5, pct: 3, example: 30 },
    { level: 6, pct: 2, example: 20 },
  ];
  return (
    <Section id="plan">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <Badge tone="zinc">Referral & Unilevel</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Simple plan built for duplication</h2>
          <p className="mt-2 text-zinc-300 max-w-prose">
            Sponsor up to six direct legs. Team grows unlimited in depth; payouts apply up to six levels. Daily earning caps and re‑entry encourage sustainability.
          </p>

          <div className={`${glass} mt-6 overflow-hidden`}> 
            <div className="grid grid-cols-3 text-xs uppercase tracking-wider text-zinc-400">
              <div className="px-4 py-2">Level</div>
              <div className="px-4 py-2">Bonus %</div>
              <div className="px-4 py-2">₹1,00,000 Example</div>
            </div>
            <div className="divide-y divide-white/10">
              {rows.map((r) => (
                <div key={r.level} className="grid grid-cols-3">
                  <div className="px-4 py-2">L{r.level}</div>
                  <div className="px-4 py-2">{r.pct}%</div>
                  <div className="px-4 py-2">${r.example}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            * Direct referral 10% instant. * Unilevel pays as per level %. * Daily cap: earnings limited to package value per day.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`${glass} p-6`}
        >
          <h3 className="text-lg font-semibold">Example growth with six‑wide duplication</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Level 1", val: "₹60,000" },
              { label: "Level 2", val: "₹2,16,000" },
              { label: "Level 3", val: "₹10,80,000" },
              { label: "Level 4", val: "₹51,84,000" },
              { label: "Level 5", val: "₹2,33,28,000" },
              { label: "Level 6", val: "₹9,33,12,000" },
            ].map((i) => (
              <div key={i.label} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="text-zinc-300">{i.label}</span>
                <span className="font-semibold">{i.val}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            Potential projections are illustrative and subject to caps, re‑entries, and real participation.
          </p>
        </motion.div>
      </div>
    </Section>
  );
}

// ---- Passport / KYC ----
function PassportSection() {
  return (
    <Section id="passport">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <Badge tone="violet">Sagenex Passport</Badge>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Next‑gen KYC & unified identity</h2>
          <p className="mt-2 text-zinc-300 max-w-prose">
            Verify once, access everywhere. AI‑assisted document checks, biometrics and sanctions screening issue a Universal SGX‑ID for seamless login across the ecosystem.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-zinc-300">
            {[
              "AI document authentication & liveness",
              "Geolocation + address confirmation",
              "Unique USGX‑ID across products",
              "Single‑sign access to PMS, bots & more",
            ].map((b) => (
              <li key={b} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-300"/> {b}</li>
            ))}
          </ul>

          <div className="mt-6 flex gap-3">
            <CTA href="/login" label="Start KYC" />
            <CTA href="/login" label="Docs" variant="secondary" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className={`${glass} p-6`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { k: "Identity", v: "Govt ID + biometrics" },
              { k: "Security", v: "AML / sanction lists" },
              { k: "Passport", v: "USGX‑ID issued" },
              { k: "Access", v: "Ecosystem‑wide login" },
            ].map((i) => (
              <div key={i.k} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-widest text-zinc-400">{i.k}</div>
                <div className="mt-1 font-semibold">{i.v}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

// ---- Cash Card ----
// function CashCardSection() {
//   return (
//     <Section id="card">
//       <div className="grid lg:grid-cols-2 gap-10 items-center">
//         <motion.div
//           initial={{ opacity: 0, y: 24 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.45 }}
//           className={`${glass} relative overflow-hidden`}
//         >
//           <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br from-emerald-400/30 via-white/20 to-violet-400/30"/>
//           <div className="relative grid place-items-center aspect-[16/10]">
//             <Image src="/card-preview.png" alt="Sagenex cash card" fill className="object-cover"/>
//           </div>
//         </motion.div>

//         <div>
//           <Badge tone="emerald">Global Cash Card</Badge>
//           <h2 className="mt-3 text-3xl font-semibold tracking-tight">Withdraw earnings anywhere</h2>
//           <p className="mt-2 text-zinc-300 max-w-prose">
//             Access commissions and incentives directly. Use online and offline where major cards are accepted. Subject to KYC, AML, and card network rules.
//           </p>
//           <ul className="mt-6 grid gap-3 text-sm text-zinc-300">
//             {[
//               "ATM withdrawals & global spend",
//               "Package‑based flexible limits",
//               "Backed by international partners",
//               "Rewards & cashback (coming soon)",
//             ].map((b) => (
//               <li key={b} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300"/> {b}</li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </Section>
//   );
// }

// ---- Timeline / Roadmap ----
function TimelineSection() {
  const items = [
    { title: "SGX Coin launch & PMS rollout", meta: "Phase 1" },
    { title: "Community 1M+ · Debit card · Staking pools", meta: "Phase 2" },
    { title: "SGX Exchange · E‑commerce payments", meta: "Phase 3" },
    { title: "RWA tokenization · APAC expansion", meta: "Phase 4" },
    { title: "Multiple listings · Top 25 VAM", meta: "Phase 5" },
    { title: "Smart Wealth City · IPO ambition", meta: "Vision" },
  ];
  return (
    <Section id="timeline">
      <div className="max-w-2xl">
        <Badge tone="zinc">Roadmap</Badge>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">Our growth, together</h2>
        <p className="mt-2 text-zinc-300">Milestones that align product, compliance and community expansion.</p>
      </div>

      <div className="mt-8">
        <ol className="relative ml-2 border-l border-white/10">
          {items.map((it) => (
            <li key={it.title} className="mb-6 ml-6">
              <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/80 ring-2 ring-zinc-900"/>
              <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-widest text-zinc-400">{it.meta}</div>
                <div className="mt-1 font-semibold">{it.title}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ---- Legal strip ----
function LegalStrip() {
  return (
    <div className="border-t border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),transparent)]">
      <div className={`${container} py-6 text-xs text-zinc-400`}> 
        <p className="max-w-4xl">
          Disclaimer: Sagenex (SGX) operates internationally and is not registered with SEBI/RBI in India or certain local regulators. Participation is voluntary and subject to KYC/AML and applicable laws in your jurisdiction. Returns and rewards are performance‑based and not guaranteed.
        </p>
      </div>
    </div>
  );
}

// ---- Footer ----
export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black">
      <div className={`${container} py-12 grid gap-8 md:grid-cols-4`}>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/logo5.png" alt="Sagenex" fill className="object-contain"/>
            </div>
            <span className="font-semibold">Sagenex</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-zinc-400">A global ecosystem blending AI, blockchain and real‑world assets to help leaders scale responsibly.</p>
        </div>
        <div>
          <div className="text-sm font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li><Link href="/login" className="hover:text-white">About Us</Link></li>
            <li><Link href="/login" className="hover:text-white">Timeline</Link></li>
            <li><Link href="/login" className="hover:text-white">Levels</Link></li>
            <li><Link href="/login" className="hover:text-white">Packages</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>Dubai · Business Bay</li>
            <li>San Francisco · 455 Market St</li>
            <li><a href="mailto:support@sagenex.io" className="hover:text-white">support@sagenex.io</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={`${container} flex flex-col sm:flex-row items-center justify-between py-5 text-xs text-zinc-500`}>
          <div>© {new Date().getFullYear()} Sagenex L.L.C. All rights reserved.</div>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <Link href="#" className="hover:text-zinc-300">Terms</Link>
            <Link href="#" className="hover:text-zinc-300">Privacy</Link>
            <Link href="#" className="hover:text-zinc-300">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---- Placeholder static pages (non‑functional content scaffolds) ----
export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">About Sagenex</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">We’re building compliant, education‑first growth with transparent identity and a simple, duplicable plan. This page can host your founding story, leadership bios and global offices.</p>
      </div>
    </div>
  );
}

export function TimelinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">Company Timeline</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">Lay out phased milestones: token launch, PMS rollout, exchange, e‑commerce payments, RWA tokenization, listings and long‑term vision.</p>
      </div>
    </div>
  );
}

export function LevelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">Ranks & Recognition</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">Show rank criteria, responsibilities, and monthly recognition with a clear matrix. Add caps, re‑entry and sustainability notes.</p>
      </div>
    </div>
  );
}

export function PackagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">Packages</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">Convert the Academy tiers into purchasable packages. Include feature comparison, e‑wallet equivalence, and KYC requirements.</p>
      </div>
    </div>
  );
}
