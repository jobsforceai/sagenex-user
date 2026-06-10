"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

const ROADMAP = [
  {
    year: "2025",
    title: "The Launchpad",
    items: [
      "Official Launch of SGX & PMS",
      "Onboard first 500K+ users worldwide",
      "Establish primary liquidity pools"
    ]
  },
  {
    year: "2026",
    title: "Ecosystem Expansion",
    items: [
      "Cross 1 Million+ members",
      "Launch of SGX Debit Card",
      "Staking & Yield farming pools activation"
    ]
  },
  {
    year: "2027",
    title: "Global Infrastructure",
    items: [
      "SGX Proprietary Exchange launch",
      "Blockchain-enabled E-Commerce Portal",
      "Expansion into Singapore & Hong Kong"
    ]
  },
  {
    year: "2028",
    title: "Real World Asset Tokenization",
    items: [
      "5 Million+ global members",
      "Tokenization of Real Estate & Gold",
      "Renewable Energy investments"
    ]
  },
  {
    year: "2029",
    title: "Institutional Scaling",
    items: [
      "Listing on international exchanges (HKEX, SGX)",
      "Top 25 Global Virtual Asset Management status",
      "Advanced AI trading algorithms public release"
    ]
  },
  {
    year: "2030",
    title: "The Smart Wealth City",
    items: [
      "15 Million+ active members",
      "Launch of SGX Smart Wealth City in Dubai",
      "IPO ambitions and public offering"
    ]
  }
];

export default function RoadmapSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section id="roadmap" className="landing-section-light w-full py-16 sm:py-20 md:py-28 relative overflow-hidden border-t border-[var(--landing-border-light)]">
      {/* Subtle orb */}
      <div className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[40vw] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(0,179,134,0.05)_0%,transparent_60%)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-14 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div>
            <p className="landing-eyebrow mb-3">Strategic Vision</p>
            <h2 className="landing-headline leading-none">
              Roadmap <span className="text-[var(--emerald)]">2025–2030</span>
            </h2>
          </div>
          <p className="landing-subtitle md:text-right md:max-w-sm">
            A step-by-step masterplan to build the most resilient and expansive wealth ecosystem of the decade.
          </p>
        </motion.div>

        {/* Mobile: Vertical timeline */}
        <div className="lg:hidden">
          <div className="relative pl-8 border-l-2 border-[var(--landing-border-light)] space-y-8">
            {ROADMAP.map((phase, idx) => (
              <motion.div
                key={phase.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="relative"
              >
                {/* Dot */}
                <div className="absolute -left-[calc(2rem+5px)] top-1 h-3 w-3 rounded-full border-2 border-[var(--emerald)] bg-[var(--landing-bg-light)]" />
                {/* Year badge */}
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-[var(--emerald)] text-sm font-black font-display mb-2 border border-emerald-100">
                  {phase.year}
                </span>
                <h4 className="text-[var(--landing-text-dark)] font-bold text-lg font-display mb-3">{phase.title}</h4>
                <ul className="space-y-2">
                  {phase.items.map((item, i) => (
                    <li key={i} className="text-sm text-[var(--landing-text-muted)] leading-relaxed flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--emerald)] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: Horizontal scroll timeline */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden lg:flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {ROADMAP.map((phase, idx) => (
            <motion.div
              key={phase.year}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="landing-card min-w-[300px] flex-shrink-0 snap-start relative group"
            >
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--emerald)] to-transparent rounded-t-[var(--landing-radius)]" />
              <h3 className="font-display text-3xl font-black text-[var(--emerald)] mb-1">{phase.year}</h3>
              <h4 className="text-[var(--landing-text-dark)] font-bold text-lg mb-4">{phase.title}</h4>
              <ul className="space-y-2.5">
                {phase.items.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--landing-text-muted)] leading-relaxed flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--emerald)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll hint for desktop */}
        <div className="hidden lg:flex justify-center mt-6 gap-1.5">
          {ROADMAP.map((_, i) => (
            <div key={i} className="h-1 w-6 rounded-full bg-[var(--landing-border-light)]" />
          ))}
        </div>

      </div>
    </section>
  );
}
