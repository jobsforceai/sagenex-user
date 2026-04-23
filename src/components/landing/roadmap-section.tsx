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
    <section id="roadmap" className="section-dark w-full py-24 md:py-32 relative overflow-hidden border-t border-[var(--border-dark)]">
      <div className="absolute inset-0 pointer-events-none">
         <div className="orb-emerald" style={{ bottom: '-10%', left: '-10%', width: '50vw', height: '50vw' }} />
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div>
            <p className="eyebrow mb-4">Strategic Vision</p>
            <h2 className="display-headline leading-none">
              Roadmap <span className="text-[var(--emerald)]">2025–2030</span>
            </h2>
          </div>
          <p className="text-[var(--text-muted-dark)] max-w-sm text-sm md:text-right">
            A step-by-step masterplan to build the most resilient and expansive wealth ecosystem of the decade.
          </p>
        </motion.div>

        <motion.div 
          ref={containerRef}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="timeline-track"
        >
          {ROADMAP.map((phase, idx) => (
            <motion.div 
              key={phase.year}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="timeline-item"
            >
              <div className="timeline-dot" />
              <h3 className="timeline-year">{phase.year}</h3>
              <h4 className="text-black font-bold text-lg mb-4">{phase.title}</h4>
              <ul className="space-y-3">
                {phase.items.map((item, i) => (
                  <li key={i} className="text-sm text-[var(--text-muted-dark)] leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
