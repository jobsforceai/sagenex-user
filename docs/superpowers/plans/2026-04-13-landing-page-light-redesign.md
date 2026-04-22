# Landing Page Light Mode Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely redesign the Sagenex landing page from dark/glassmorphism to a Groww-inspired professional light mode with animated number counters, word-reveal headline, cityscape parallax, infinite marquee ticker, and scroll-triggered card reveals.

**Architecture:** Every section file is rewritten in-place (same filenames, same imports in page.tsx). A new `marquee-ticker.tsx` component is added. The Navbar gets a scroll-aware background transition. The ProfitCalculator moves from a floating modal trigger to a full inline section. All dark colours → white/light-grey backgrounds, `#00b386` Groww green as the primary accent.

**Tech Stack:** Next.js 15 App Router · Tailwind CSS v4 · Framer Motion · GSAP + ScrollTrigger · Lucide React · Recharts · React Icons

---

## Colour & Design Tokens (reference for all tasks)

```
Groww green:        #00b386
Green hover:        #00a378
Green light bg:     #e6f7f3
Green dark:         #00875f
Page bg:            #ffffff
Alt section bg:     #f7f8fa
Text primary:       #1a1a1a
Text secondary:     #555555
Text muted:         #888888
Border colour:      #e8e8e8
Card shadow:        0 2px 8px rgba(0,0,0,0.08)
Card hover shadow:  0 8px 24px rgba(0,0,0,0.12)
Footer bg:          #071f16   (dark, kept for contrast)
```

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/globals.css` | Modify | Add `@keyframes marquee`, counter util, light-mode utilities |
| `src/app/components/Navbar.tsx` | Modify | Add scroll state → transparent-to-white transition, light text colours |
| `src/components/landing/home-page.tsx` | Rewrite | Groww-style hero: word-reveal headline, cityscape, parallax, count-up stats |
| `src/components/landing/marquee-ticker.tsx` | **Create** | Infinite CSS marquee of platform/product names |
| `src/components/landing/ecosystem-section.tsx` | Rewrite | Light mode: white cards, green accents, stagger reveal |
| `src/components/landing/sagenex-academy.tsx` | Rewrite | Light mode: white cards, keep tier colour ribbons |
| `src/components/landing/profit-calculator.tsx` | Rewrite | Inline section (no floating button), light card UI |
| `src/components/landing/app-download.tsx` | Rewrite | Light mode section |
| `src/components/landing/faq-section.tsx` | Rewrite | Light mode accordion |
| `src/components/landing/footer.tsx` | Modify | Keep dark footer, update gold divider to green |
| `src/app/page.tsx` | Modify | Add MarqueeTicker import, remove NextLevelLanding, reorder sections |

---

## Task 1: CSS Foundation

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add marquee keyframe and ticker utility to globals.css**

Append to the end of `src/app/globals.css`:

```css
/* ── Marquee / infinite ticker ── */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 28s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}

/* ── Count-up numbers ── */
.stat-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

/* ── Groww-green button ── */
.btn-groww {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #00b386;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  padding: 11px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
  box-shadow: 0 2px 12px rgba(0,179,134,0.25);
}
.btn-groww:hover {
  background: #00a378;
  box-shadow: 0 4px 20px rgba(0,179,134,0.35);
  transform: translateY(-1px);
}
.btn-groww:active {
  transform: translateY(0);
}

.btn-groww-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  color: #00b386;
  font-weight: 600;
  font-size: 15px;
  padding: 10px 24px;
  border-radius: 8px;
  border: 1.5px solid #00b386;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.btn-groww-outline:hover {
  background: #e6f7f3;
}

/* ── Light section card ── */
.light-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  transition: box-shadow 0.25s, transform 0.25s;
}
.light-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transform: translateY(-4px);
}
```

- [ ] **Step 2: Verify dev server still starts**

```bash
pnpm dev
```
Expected: Server starts without CSS errors on port 3000.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add marquee, btn-groww, light-card CSS utilities for redesign"
```

---

## Task 2: Navbar – Scroll-Aware Light Mode

**Files:**
- Modify: `src/app/components/Navbar.tsx`

The navbar keeps ALL its auth logic, impersonation banner, mobile drawer, and link definitions unchanged. We only update:
1. Add `scrolled` state driven by `window.scrollY > 10`
2. Switch the glass shell (`bg-black/35 backdrop-blur-xl border-white/10`) to white on scroll
3. Switch text colours: `text-zinc-200` → `text-zinc-700`, active link underline colour → green

- [ ] **Step 1: Add scrolled state (insert after existing useState declarations around line 55)**

```tsx
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

- [ ] **Step 2: Replace the glass shell div (around line 226) with scroll-aware classes**

Find:
```tsx
<div
  className="mt-3 rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl
             shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
>
```

Replace with:
```tsx
<div
  className={[
    "mt-3 rounded-2xl border transition-all duration-300",
    scrolled
      ? "border-[#e8e8e8] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
      : "border-white/10 bg-white/0 backdrop-blur-xl shadow-none",
  ].join(" ")}
>
```

- [ ] **Step 3: Replace nav item text colours**

Find `navItemClass` function and replace its body:
```tsx
const navItemClass = (href: string) =>
  [
    "relative px-2 py-1 text-sm md:text-[15px] transition",
    scrolled ? "text-zinc-700 hover:text-zinc-900" : "text-zinc-800 hover:text-zinc-900",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b386]/50 rounded-md",
    isActive(href) && "text-[#00b386] font-semibold",
  ]
    .filter(Boolean)
    .join(" ");
```

- [ ] **Step 4: Update brand name colour (around line 247)**

Find:
```tsx
<span className="text-base font-semibold tracking-tight text-white group-hover:opacity-90">
```
Replace with:
```tsx
<span className={`text-base font-semibold tracking-tight group-hover:opacity-90 ${scrolled ? "text-zinc-900" : "text-zinc-900"}`}>
```

- [ ] **Step 5: Update active link underline colour (around line 269)**

Find:
```tsx
<span className="absolute left-2 right-2 -bottom-1 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
```
Replace with:
```tsx
<span className="absolute left-2 right-2 -bottom-1 h-px bg-[#00b386] rounded-full" />
```

- [ ] **Step 6: Update mobile drawer background**

Find the mobile drawer's outer `<div className="px-4 pb-4 pt-1">` wrapper and add `bg-white` to the parent `motion.div`:

Find:
```tsx
className="md:hidden overflow-hidden"
```
Replace with:
```tsx
className="md:hidden overflow-hidden bg-white rounded-b-2xl"
```

- [ ] **Step 7: Update mobile link text colours**

In the mobile drawer link className, replace `text-zinc-200 hover:text-white hover:bg-white/5` with `text-zinc-700 hover:text-zinc-900 hover:bg-[#f7f8fa]`.

Also replace `isActive(l.href) && "bg-white/5 text-white"` with `isActive(l.href) && "bg-[#e6f7f3] text-[#00b386]"`.

- [ ] **Step 8: Update the top sheen line (bottom of component)**

Find:
```tsx
<div className="pointer-events-none absolute inset-x-0 top-0">
  <div className="mx-auto h-[1px] w-full max-w-7xl bg-gradient-to-r from-transparent via-white/60 to-transparent" />
</div>
```
Remove this div entirely — it's only needed on dark backgrounds.

- [ ] **Step 9: Verify mobile hamburger icon is dark**

Find the mobile toggle button's SVG stroke and make sure the button text colour reads dark:

Find:
```tsx
className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10
           bg-white/5 text-white/90 hover:bg-white/10 ..."
```
Replace with:
```tsx
className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e8e8]
           bg-white text-zinc-700 hover:bg-[#f7f8fa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b386]/50"
```

- [ ] **Step 10: Commit**

```bash
git add src/app/components/Navbar.tsx
git commit -m "feat: navbar light mode with scroll-aware transparent-to-white transition"
```

---

## Task 3: Hero Section Rewrite

**Files:**
- Rewrite: `src/components/landing/home-page.tsx`

Replace the entire file with a Groww-style hero: word-by-word headline reveal, cityscape SVG at the bottom with parallax, and count-up stats bar. The `cityScape.svg` already exists in `/public/`.

- [ ] **Step 1: Replace home-page.tsx entirely**

```tsx
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
```

- [ ] **Step 2: Verify it renders — check dev server at localhost:3000**

```bash
pnpm dev
```
Expected: White hero, word-by-word headline animation on load, green badge, two CTA buttons, stats bar visible, cityscape image visible at bottom.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/home-page.tsx
git commit -m "feat: Groww-style hero with word-reveal, count-up stats, cityscape parallax"
```

---

## Task 4: Marquee Ticker

**Files:**
- Create: `src/components/landing/marquee-ticker.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

const ITEMS = [
  { name: "SG Trading", tag: "Crypto" },
  { name: "SGChain", tag: "Blockchain" },
  { name: "SGGOLD", tag: "Gold Rewards" },
  { name: "SGBN", tag: "Business Network" },
  { name: "SGSE", tag: "Securities" },
  { name: "Forex Trading", tag: "Managed" },
  { name: "Gold Mining", tag: "Africa" },
  { name: "Real Estate", tag: "International" },
  { name: "Agriculture Yields", tag: "Non-correlated" },
  { name: "SG Travels Club", tag: "Lifestyle" },
];

export default function MarqueeTicker() {
  // Duplicate for seamless loop
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section className="w-full bg-[#f7f8fa] border-y border-[#e8e8e8] py-4 overflow-hidden">
      <div className="animate-marquee">
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 mx-8 flex-shrink-0"
          >
            <span className="h-2 w-2 rounded-full bg-[#00b386] flex-shrink-0" />
            <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
              {item.name}
            </span>
            <span className="text-xs text-[#888] whitespace-nowrap bg-[#e6f7f3] px-2 py-0.5 rounded-full">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/marquee-ticker.tsx
git commit -m "feat: add infinite marquee ticker for platform/product names"
```

---

## Task 5: Ecosystem Section — Light Mode

**Files:**
- Rewrite: `src/components/landing/ecosystem-section.tsx`

- [ ] **Step 1: Replace the file entirely**

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const mainCards = [
  {
    name: "SG Trading",
    description: "Advanced trading platform for cryptocurrency and digital assets with professional-grade tools.",
    url: "https://sg5trader.sgxmeta.ai",
    image: "/sg5trader.png",
    tag: "Crypto Trading",
    tagColor: "#f97316",
  },
  {
    name: "SGChain",
    description: "Our revolutionary decentralized blockchain platform built for speed, security, and scalability.",
    url: "https://sgchain.sgxmeta.ai",
    image: "/sgchain.png",
    tag: "Blockchain",
    tagColor: "#6366f1",
  },
  {
    name: "SGGOLD",
    description: "Loyalty rewards powered by SG Gold — eligibility codes and exclusive gold incentives.",
    url: "https://sggold.sgxmeta.ai/",
    image: "/globe-3d-gold.png",
    tag: "Gold Rewards",
    tagColor: "#d97706",
  },
  {
    name: "SGBN",
    description: "Business network connecting entrepreneurs and investors for collaborative growth.",
    url: "https://sgbn.sgxmeta.ai",
    image: "/sgbn.png",
    tag: "Business Network",
    tagColor: "#0ea5e9",
  },
  {
    name: "SGSE",
    description: "Securities exchange platform for tokenized assets and innovative investment opportunities.",
    url: "https://sgse.sgxmeta.ai",
    image: "/sgse1.png",
    tag: "Securities",
    tagColor: "#00b386",
  },
];

const secondaryCards = [
  { name: "Forex Trading", desc: "Professionally managed strategies with risk-controlled deployment.", icon: "💱" },
  { name: "Int. Real Estate", desc: "Strategic exposure to overseas markets focusing on asset value appreciation.", icon: "🏢" },
  { name: "Gold Mining", desc: "Physical asset-backed industries in Africa as a hedge against inflation.", icon: "⛏️" },
  { name: "Agriculture Yields", desc: "Non-correlated participation in food security and export models.", icon: "🌾" },
  { name: "SG Travels Club", desc: "Utility vertical designed for lifestyle and community benefits.", icon: "✈️", comingSoon: true },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 22 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function EcosystemSection() {
  return (
    <section id="ecosystem" className="w-full bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Our Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a1a1a] mb-4">
              One Platform. Multiple{" "}
              <span className="text-[#00b386]">Verticals.</span>
            </h2>
            <p className="text-[#555] text-lg max-w-2xl mx-auto">
              Explore our innovative platforms designed to revolutionise your blockchain, trading, and investment experience.
            </p>
          </motion.div>
        </div>

        {/* Main cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {mainCards.map((card) => (
            <motion.div key={card.name} variants={cardVariants} className="group light-card overflow-hidden">
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-[#f7f8fa]">
                {card.image && (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: card.tagColor + "18", color: card.tagColor }}
                  >
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{card.name}</h3>
                <p className="text-sm text-[#555] leading-relaxed mb-4">{card.description}</p>
                {card.url && (
                  <Link
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00b386] hover:text-[#00875f] transition-colors"
                  >
                    Visit {card.name} <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary verticals */}
        <div>
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-5 text-center">Additional Investment Verticals</h3>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {secondaryCards.map((card) => (
              <motion.div
                key={card.name}
                variants={cardVariants}
                className="light-card p-5 flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0">{card.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#1a1a1a] text-sm">{card.name}</h4>
                    {card.comingSoon && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify at localhost:3000 — scroll to ecosystem section**

Expected: White cards with subtle shadows, green tags, images visible, stagger reveal on scroll.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/ecosystem-section.tsx
git commit -m "feat: ecosystem section light mode with stagger reveal"
```

---

## Task 6: Academy Section — Light Mode

**Files:**
- Rewrite: `src/components/landing/sagenex-academy.tsx`

The tier colour ribbons (gold, bronze, silver, platinum, etc.) are kept — they're Sagenex identity. The card body becomes white/light.

- [ ] **Step 1: Replace the file**

```tsx
"use client";
import Image from "next/image";
import { motion } from "framer-motion";

type Tier = { tier: string; price: number; items: string[]; goal: string };

const DATA: Tier[] = [
  { tier: "Starter Academy", price: 50, items: ["Basics of Crypto & Blockchain", "Intro to Unilevel Business Model"], goal: "Kickstart journey with foundations." },
  { tier: "Bronze Academy", price: 100, items: ["Affiliate Marketing Basics", "Intro Wallets & Trading"], goal: "Build skills + start duplication." },
  { tier: "Silver Academy", price: 300, items: ["Technical Analysis Basics", "Duplication Workshops"], goal: "Handle first 50–100 team members." },
  { tier: "Gold Academy", price: 500, items: ["Leadership Blueprint", "Passive vs Active Income"], goal: "Transition to Leader Rank." },
  { tier: "Platinum Academy", price: 1000, items: ["Market Analysis", "Compliance & Taxation Basics"], goal: "Prepare for Manager Rank (1,000+ teams)." },
  { tier: "Titanium Academy", price: 2500, items: ["Multi-Country Network Growth", "Mastermind Access"], goal: "Train to become Director." },
  { tier: "Diamond Academy", price: 5000, items: ["CEO Mindset Training", "Investment Diversification"], goal: "Crown Ambassador Level." },
  { tier: "Crown Academy", price: 10000, items: ["Elite Global Leadership Training", "Direct 1-on-1 Mentorship", "Luxury Global Summits (Dubai/Thailand/Europe)", "Premium Business Expansion Tools"], goal: "Build global empire under SAGENEX." },
];

const tierImages: Record<string, string> = {
  "Titanium Academy": "/academy/3.png",
  "Diamond Academy": "/academy/4.png",
  "Crown Academy": "/academy/5.png",
};

function getTierRibbon(tier: string) {
  if (tier.includes("Platinum")) return { ribbon: "from-[#a78bfa] to-[#7c3aed]", price: "#7c3aed", wallet: "bg-purple-50 border-purple-200 text-purple-700" };
  if (tier.includes("Gold"))     return { ribbon: "from-[#b58a2b] to-[#f1d27a]", price: "#b58a2b", wallet: "bg-amber-50 border-amber-200 text-amber-700" };
  if (tier.includes("Silver"))   return { ribbon: "from-[#8e8f93] to-[#cfd3d6]", price: "#555", wallet: "bg-gray-50 border-gray-200 text-gray-600" };
  if (tier.includes("Bronze"))   return { ribbon: "from-[#7a4b2c] to-[#b5763a]", price: "#7a4b2c", wallet: "bg-orange-50 border-orange-200 text-orange-700" };
  if (tier.includes("Crown"))    return { ribbon: "from-[#1a1a1a] to-[#444]", price: "#1a1a1a", wallet: "bg-gray-50 border-gray-200 text-gray-700" };
  if (tier.includes("Diamond"))  return { ribbon: "from-[#0ea5e9] to-[#6366f1]", price: "#0ea5e9", wallet: "bg-sky-50 border-sky-200 text-sky-700" };
  if (tier.includes("Titanium")) return { ribbon: "from-[#475569] to-[#94a3b8]", price: "#475569", wallet: "bg-slate-50 border-slate-200 text-slate-600" };
  return { ribbon: "from-[#00b386] to-[#00875f]", price: "#00875f", wallet: "bg-[#e6f7f3] border-[#b2e5d8] text-[#00875f]" };
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } } };

export default function SagenexAcademy() {
  return (
    <section id="academy" className="w-full bg-[#f7f8fa] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Sagenex Academy
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a1a1a] mb-3 tracking-tight">
            LEARN, EARN &amp; LEAD
          </h2>
          <p className="text-[#555] text-lg max-w-3xl mx-auto">
            Eight progressive tracks from Starter to Crown — turning beginners into confident global leaders through structured, real-world training.
          </p>
        </div>

        {/* Tier grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {DATA.map((c) => {
            const { ribbon, price, wallet } = getTierRibbon(c.tier);
            const img = tierImages[c.tier];
            return (
              <motion.article
                key={c.tier}
                variants={item}
                whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                className="bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
              >
                {/* Ribbon */}
                <div className={`bg-gradient-to-r ${ribbon} px-4 py-2.5 flex items-center justify-between`}>
                  <span className="text-sm font-bold text-white">{c.tier}</span>
                  {img && <Image src={img} alt={c.tier} width={28} height={28} className="h-7 w-7" />}
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-3xl font-extrabold mb-3" style={{ color: price }}>
                    <span className="text-base align-top" style={{ color: price }}>$</span>
                    {c.price.toLocaleString()}
                  </div>

                  <ul className="list-disc pl-4 space-y-1 text-sm text-[#555] min-h-[4.5rem] flex-1">
                    {c.items.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>

                  <div className={`mt-4 flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold ${wallet}`}>
                    <span className="text-xs tracking-wide opacity-75">E-WALLET</span>
                    <span>${c.price.toLocaleString()}</span>
                  </div>

                  <p className="mt-3 text-xs text-[#888]">
                    <span className="font-semibold text-[#444]">Goal:</span> {c.goal}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Footer tag line */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-[#555]">
          {["Learn + Earn model at all levels", "E-Wallet = Package value (no-risk learning)", "Recognition at each level with perks"].map(t => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b386]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/sagenex-academy.tsx
git commit -m "feat: academy section light mode with tier colour ribbons preserved"
```

---

## Task 7: Profit Calculator — Inline Light Mode Section

**Files:**
- Rewrite: `src/components/landing/profit-calculator.tsx`

Remove the floating button + modal. Replace with a full inline section.

- [ ] **Step 1: Replace profit-calculator.tsx entirely**

```tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Info, RefreshCcw, Percent } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type AssetKey = "sagenex" | "gold" | "land" | "stocks" | "cash";
type Asset = { key: AssetKey; label: string; color: string; defaultAPR: number; hint: string };

const ASSETS: Asset[] = [
  { key: "sagenex", label: "Sagenex",         color: "#00b386", defaultAPR: 12, hint: "Adjust expected annual return (illustrative)." },
  { key: "stocks",  label: "Stock Market",    color: "#6366f1", defaultAPR: 8,  hint: "Long-run nominal avg often ~7–10%." },
  { key: "gold",    label: "Gold",            color: "#d97706", defaultAPR: 6,  hint: "Historic nominal trend ~4–8% with cycles." },
  { key: "land",    label: "Real Estate",     color: "#0ea5e9", defaultAPR: 4.5,hint: "Appreciation ex-rent; location specific." },
  { key: "cash",    label: "Cash (Ref)",      color: "#9ca3af", defaultAPR: 3,  hint: "Bank/APY (varies)." },
];

function compound(p: number, r: number, y: number) { return p * Math.pow(1 + r / 100, y); }

export default function ProfitCalculator() {
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(3);
  const [inflation, setInflation] = useState(4);
  const [showReal, setShowReal] = useState(false);
  const [rates, setRates] = useState<Record<AssetKey, number>>(
    Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>
  );

  const data = useMemo(() => ASSETS.map(a => {
    const eff = showReal ? ((1 + rates[a.key] / 100) / (1 + inflation / 100) - 1) * 100 : rates[a.key];
    const final = compound(amount, eff, years);
    return { key: a.key, label: a.label, color: a.color, final, profit: final - amount, rate: eff };
  }).sort((a, b) => b.profit - a.profit), [amount, years, rates, showReal, inflation]);

  const reset = () => {
    setAmount(1000); setYears(3); setInflation(4); setShowReal(false);
    setRates(Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>);
  };

  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Calculator className="inline h-3.5 w-3.5 mr-1.5" />
            Profit Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-3">
            See How Your Money <span className="text-[#00b386]">Grows</span>
          </h2>
          <p className="text-[#555] max-w-xl mx-auto">
            Compare Sagenex returns against Gold, Real Estate, Stocks, and Cash side by side.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#f7f8fa] border border-[#e8e8e8] rounded-3xl p-6 sm:p-8"
        >
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Amount */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <label className="text-sm font-semibold text-[#1a1a1a] block mb-2">Amount (USD)</label>
              <input
                type="number" min={50} step={50} value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#00b386]/30"
              />
              <input type="range" min={50} max={100000} step={50} value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="mt-2 w-full accent-[#00b386]" />
            </div>
            {/* Years */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <label className="text-sm font-semibold text-[#1a1a1a] block mb-2">Years: {years}</label>
              <input type="range" min={1} max={15} value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-[#00b386] mt-1" />
              <div className="flex justify-between text-xs text-[#888] mt-1">
                <span>1 yr</span><span>15 yrs</span>
              </div>
            </div>
            {/* Inflation */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-[#888]" /> Inflation: {inflation}%
                </label>
              </div>
              <input type="range" min={0} max={12} value={inflation}
                onChange={e => setInflation(parseFloat(e.target.value))}
                className="w-full accent-[#00b386]" />
              <div className="flex items-center justify-between mt-2">
                <label className="text-xs text-[#555]">Show real returns</label>
                <input type="checkbox" className="h-4 w-4 accent-[#00b386]" checked={showReal}
                  onChange={e => setShowReal(e.target.checked)} />
              </div>
            </div>
          </div>

          {/* Rate sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {ASSETS.map(a => (
              <div key={a.key} className="bg-white border border-[#e8e8e8] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1a1a1a]">{a.label}</span>
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                </div>
                <div className="text-xs text-[#555] mb-1">APR: <span className="font-bold">{rates[a.key].toFixed(1)}%</span></div>
                <input type="range" min={0} max={a.key === "sagenex" ? 40 : 20} step={0.5}
                  value={rates[a.key]} className="w-full accent-[#00b386]"
                  style={{ accentColor: a.color }}
                  onChange={e => setRates(r => ({ ...r, [a.key]: parseFloat(e.target.value) }))} />
                <p className="text-[10px] text-[#888] mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" /> {a.hint}
                </p>
              </div>
            ))}
          </div>

          {/* Chart + table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Final Value after {years} year{years > 1 ? "s" : ""}</p>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={data.map(d => ({ name: d.label, Value: Math.round(d.final), fill: d.color }))}
                    margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e8e8e8", fontSize: 12 }} />
                    <Bar dataKey="Value" radius={[6, 6, 0, 0]} fill="#00b386"
                      label={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1a1a1a]">Breakdown</p>
                <button onClick={reset}
                  className="inline-flex items-center gap-1 border border-[#e8e8e8] rounded-lg px-2 py-1 text-xs text-[#555] hover:bg-[#f7f8fa]">
                  <RefreshCcw className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#888] text-xs">
                    <th className="pb-2">Asset</th><th className="pb-2">Rate</th><th className="pb-2">Final</th><th className="pb-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.key} className="border-t border-[#f0f0f0]">
                      <td className="py-2 text-[#1a1a1a] flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {d.label}
                      </td>
                      <td className="py-2 text-[#555]">{d.rate.toFixed(1)}%</td>
                      <td className="py-2 text-[#1a1a1a] font-medium">${d.final.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 font-semibold" style={{ color: d.profit >= 0 ? "#00b386" : "#ef4444" }}>
                        {d.profit >= 0 ? "+" : "-"}${Math.abs(d.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-[11px] text-[#888] flex items-start gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Illustrative only. Not financial advice.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/profit-calculator.tsx
git commit -m "feat: profit calculator as inline light mode section (remove floating button)"
```

---

## Task 8: App Download — Light Mode

**Files:**
- Rewrite: `src/components/landing/app-download.tsx`

- [ ] **Step 1: Replace app-download.tsx**

```tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Smartphone, ShieldCheck, Bell } from "lucide-react";
import { FaAndroid, FaApple } from "react-icons/fa";

const features = [
  { icon: Smartphone, title: "Full Dashboard Access", desc: "Manage your portfolio, track earnings, and view team progress on the go." },
  { icon: ShieldCheck, title: "Secure Wallet Management", desc: "Deposit, withdraw, and transfer funds with the same security as the web platform." },
  { icon: Bell, title: "Real-time Notifications", desc: "Instant alerts for new sign-ups, payouts, and important announcements." },
];

export default function AppDownloadSection() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || "https://example.com/sagenex.apk";
  const iosUrl = "https://apps.apple.com/us/app/sagenex/id6755692818";

  return (
    <section id="android-app" className="w-full bg-[#f7f8fa] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="flex justify-center"
          >
            <div className="relative w-[260px] h-[530px] sm:w-[300px] sm:h-[610px]">
              <Image src="/mobdash.JPG" alt="Sagenex App" fill className="object-contain drop-shadow-2xl" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              Mobile App
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-4 leading-tight">
              Access Sagenex{" "}
              <span className="text-[#00b386]">On The Go</span>
            </h2>
            <p className="text-[#555] text-lg mb-8">
              Download our official app to stay connected with the Sagenex ecosystem anytime, anywhere.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-white border border-[#e8e8e8] rounded-xl p-4 shadow-sm">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#e6f7f3] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#00b386]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a1a1a] text-sm mb-0.5">{title}</h3>
                    <p className="text-sm text-[#555]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={apkUrl} target="_blank">
                <button className="btn-groww gap-2">
                  <FaAndroid className="h-5 w-5" /> Download for Android
                </button>
              </Link>
              <Link href={iosUrl} target="_blank">
                <button className="btn-groww-outline gap-2">
                  <FaApple className="h-5 w-5" /> Download for iOS
                </button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-[#888]">*Requires Android 8.0 or later.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/app-download.tsx
git commit -m "feat: app download section light mode"
```

---

## Task 9: FAQ Section — Light Mode

**Files:**
- Rewrite: `src/components/landing/faq-section.tsx`

- [ ] **Step 1: Replace faq-section.tsx**

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, TrendingUp, Globe, Building2, Eye, AlertCircle, Scale, CheckCircle } from "lucide-react";
import { useState } from "react";

type FAQ = { question: string; answer: string; icon: React.ElementType; details?: string[] };

const faqs: FAQ[] = [
  { question: "What is Sagenex?", answer: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth across multiple sectors.", icon: Globe },
  { question: "Is my money guaranteed or fixed?", answer: "No. Sagenex does not offer fixed or guaranteed returns. All earnings are performance-based and depend on participation, leadership, and business conditions.", icon: AlertCircle },
  { question: "How is risk controlled?", answer: "Through a multi-layered approach designed for long-term stability:", icon: Shield, details: ["Earnings caps (2.5X / 3X / 4X)", "12-leg distributed structure", "Multi-sector & multi-geography diversification", "Governance & compliance reviews"] },
  { question: "Where is capital deployed?", answer: "Across Forex, real estate, gold mining, agriculture, blockchain infrastructure, trading systems, business networks, and growth platforms.", icon: TrendingUp },
  { question: "What role does SG Stocks play?", answer: "SG Stocks acts as a business growth and credibility layer — enabling visibility, expansion, capital circulation, and hiring within the ecosystem.", icon: Building2 },
  { question: "What happens in slow market conditions?", answer: "The system is designed to slow down safely, not collapse. Caps, carryforward rules, and diversification protect stability.", icon: TrendingUp },
  { question: "How does SGBN add safety?", answer: "SGBN creates real-world value through:", icon: CheckCircle, details: ["Business referrals", "Hiring (including 30% community hiring rule)", "Freelancer engagement", "Capital circulation"] },
  { question: "Can rules change?", answer: "Yes — but only to protect sustainability. All changes are communicated transparently for long-term ecosystem health.", icon: Scale },
  { question: "Why should I trust Sagenex long-term?", answer: "Because it is Capped, Structured, Diversified, Governed, and Transparent. Short-term systems fail. Structured systems endure.", icon: Eye },
];

function FAQItem({ faq, index, openIndex, setOpenIndex }: { faq: FAQ; index: number; openIndex: number | null; setOpenIndex: (i: number | null) => void }) {
  const Icon = faq.icon;
  const isOpen = openIndex === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? "border-[#00b386]/40 shadow-[0_0_0_2px_rgba(0,179,134,0.08)]" : "border-[#e8e8e8]"} bg-white`}>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="w-full text-left p-4 flex items-center gap-3"
        >
          <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isOpen ? "bg-[#e6f7f3] text-[#00b386]" : "bg-[#f7f8fa] text-[#888]"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className={`flex-1 text-sm font-semibold leading-snug ${isOpen ? "text-[#1a1a1a]" : "text-[#333]"}`}>{faq.question}</span>
          <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#00b386]" : "text-[#aaa]"}`} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pl-14">
                <p className="text-sm text-[#555] leading-relaxed">{faq.answer}</p>
                {faq.details && (
                  <ul className="mt-3 space-y-1.5">
                    {faq.details.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#555]">
                        <CheckCircle className="h-4 w-4 text-[#00b386] flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mid = Math.ceil(faqs.length / 2);

  return (
    <section className="w-full bg-[#f7f8fa] py-20 md:py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Investor & Leader FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-3">Frequently Asked Questions</h2>
          <p className="text-[#555] text-lg max-w-2xl mx-auto">Everything you need to know about Sagenex's ecosystem, structure, and long-term vision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          <div className="space-y-3">
            {faqs.slice(0, mid).map((f, i) => (
              <FAQItem key={i} faq={f} index={i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
            ))}
          </div>
          <div className="space-y-3">
            {faqs.slice(mid).map((f, i) => (
              <FAQItem key={mid + i} faq={f} index={mid + i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
            ))}
          </div>
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center border border-[#00b386]/20 rounded-2xl bg-white p-6 md:p-8 shadow-sm"
        >
          <p className="text-xl md:text-2xl font-bold text-[#1a1a1a] mb-1">Sagenex is not built for speed.</p>
          <p className="text-xl md:text-2xl font-bold">
            It is built for{" "}
            <span className="text-[#00b386]">survival, stability, and scale.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/faq-section.tsx
git commit -m "feat: FAQ section light mode with AnimatePresence accordion"
```

---

## Task 10: Footer — Update Gold Divider → Green

**Files:**
- Modify: `src/components/landing/footer.tsx`

The footer stays dark (`#07140E`) for contrast. We only update the gold top-divider to Groww green.

- [ ] **Step 1: Update the gold divider and GOLD constant**

In `footer.tsx`, find:
```tsx
const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";
```
Replace with:
```tsx
const GREEN_ACCENT = "from-[#00b386] via-[#00d9a5] to-[#00b386]";
```

Then find:
```tsx
<div className={`relative h-[3px] w-full bg-gradient-to-r ${GOLD}`} />
```
Replace with:
```tsx
<div className={`relative h-[3px] w-full bg-gradient-to-r ${GREEN_ACCENT}`} />
```

Also update the brand name anchor to use `text-[#00b386]` instead of inheriting white:
Find:
```tsx
<span className="text-xl font-semibold tracking-wide">Sagenex</span>
```
Replace with:
```tsx
<span className="text-xl font-semibold tracking-wide text-[#00b386]">Sagenex</span>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/footer.tsx
git commit -m "feat: footer green top divider, Sagenex brand name in green"
```

---

## Task 11: Page Orchestration

**Files:**
- Modify: `src/app/page.tsx`

Update section order, add MarqueeTicker import, remove NextLevelLanding (file doesn't exist).

- [ ] **Step 1: Replace page.tsx**

```tsx
import HomePage from "@/components/landing/home-page";
import SagenexAcademy from "@/components/landing/sagenex-academy";
import EcosystemSection from "@/components/landing/ecosystem-section";
import AppDownloadSection from "@/components/landing/app-download";
import Navbar from "./components/Navbar";
import ProfitCalculator from "@/components/landing/profit-calculator";
import FAQSection from "@/components/landing/faq-section";
import Footer from "@/components/landing/footer";
import MarqueeTicker from "@/components/landing/marquee-ticker";

export default function Home() {
  return (
    <>
      <Navbar />
      <HomePage />
      <MarqueeTicker />
      <EcosystemSection />
      <SagenexAcademy />
      <ProfitCalculator />
      <AppDownloadSection />
      <FAQSection />
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run type-check**

```bash
pnpm check-types
```
Expected: No TypeScript errors.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```
Expected: No ESLint errors.

- [ ] **Step 4: Final visual review at localhost:3000**

Scroll through the entire page and verify:
- [ ] Navbar starts transparent, turns white with shadow on scroll
- [ ] Hero headline animates word-by-word on load
- [ ] Stats count up when they enter the viewport
- [ ] Cityscape parallax shifts on scroll
- [ ] Marquee ticker scrolls infinitely, pauses on hover
- [ ] Ecosystem cards stagger in on scroll, hover lift works
- [ ] Academy tier cards stagger in, tier ribbons have correct colours
- [ ] Profit calculator renders inline (no floating button), chart is visible
- [ ] App download section is white/light with icon features
- [ ] FAQ accordion opens/closes with animation
- [ ] Footer has green top divider

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: orchestrate light mode landing page — Groww-style redesign complete"
```

---

## Self-Review

**Spec coverage check:**
- ✅ White/light bg everywhere → all section BGs updated
- ✅ #00b386 Groww green accent → globals, hero, navbar, all sections
- ✅ Word-by-word headline reveal → `home-page.tsx` Task 3
- ✅ Animated number counters → `useCountUp` + `IntersectionObserver` in Task 3
- ✅ Cityscape parallax → GSAP ScrollTrigger in Task 3
- ✅ Infinite marquee ticker → `marquee-ticker.tsx` Task 4 + CSS Task 1
- ✅ Stagger card reveal → Framer Motion `staggerChildren` in Tasks 5, 6
- ✅ Sticky transparent-to-white navbar → Task 2
- ✅ Profit Calculator inline → Task 7
- ✅ Academy tier ribbons kept (brand identity) → Task 6
- ✅ FAQ with AnimatePresence accordion → Task 9
- ✅ App download light mode → Task 8
- ✅ Footer green divider → Task 10
- ✅ Page orchestration (no NextLevelLanding) → Task 11

**Placeholder scan:** No TBDs, no TODOs, no incomplete sections found.

**Type consistency:**
- `StatCounter` props match `STATS` array type in Task 3 ✅
- `FAQItem` props match usage in Task 9 ✅
- `getTierRibbon` return shape `{ ribbon, price, wallet }` matches destructuring in Task 6 ✅
- `AssetKey` union matches `ASSETS` array keys in Task 7 ✅
