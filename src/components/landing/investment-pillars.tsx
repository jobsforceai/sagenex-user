"use client";

import { motion } from "framer-motion";

const PILLARS = [
  {
    title: "Gold 11-Month Scheme",
    tag: "Exclusive",
    desc: "For existing users. Monthly entry between ₹10,000 and ₹1,00,000.",
    features: [
      "Gold Plan: 2X gold bonus at maturity",
      "Fixed 11-month plan with monthly slab payments"
    ],
    color: "#C8103E",
    accent: "from-[#C8103E]"
  },
  {
    title: "Portfolio Management (PMS)",
    tag: "Structured Returns",
    desc: "Risk-controlled portfolio allocation with structured monthly yields.",
    features: [
      "Trail (₹5,000-₹99,999): 6% Monthly Yield",
      "Standard (₹1,00,000-₹4,99,999): 7% Monthly Yield",
      "Advanced (₹5,00,000-₹9,99,999): 8% Monthly Yield",
      "Elite (₹10,00,000+): 10% Monthly Yield"
    ],
    color: "#059669",
    accent: "from-[#059669]"
  },
  {
    title: "Liquidity Provider Program",
    tag: "Yield Generation",
    desc: "Earn yield per transaction settlement across the Sagenex ecosystem.",
    features: [
      "1.9% yield per transaction settlement",
      "2-3 working days settlement cycle",
      "High liquidity & transparent tracking"
    ],
    color: "#6366f1",
    accent: "from-[#6366f1]"
  }
];

export default function InvestmentPillars() {
  return (
    <section id="investment-pillars" className="landing-section-light w-full py-16 sm:py-20 md:py-28 relative overflow-hidden border-t border-[var(--landing-border-light)]">
      {/* Subtle orb */}
      <div className="pointer-events-none absolute -left-[10%] top-[20%] h-[40vw] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(0,179,134,0.05)_0%,transparent_60%)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="landing-eyebrow mb-3">Capital Deployment</p>
          <h2 className="landing-headline max-w-3xl mx-auto">
            Our Investment <span className="text-[var(--crimson)]">Pillars</span>
          </h2>
          <p className="mt-4 landing-subtitle mx-auto text-center">
            Structured, capped, and diversified. We deploy capital across strictly managed verticals to ensure maximum ecosystem safety.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="landing-card relative overflow-hidden group"
            >
              {/* Top accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${pillar.accent} to-transparent`}
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${pillar.color}0A, transparent 60%)` }}
              />

              <span
                className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5"
                style={{ backgroundColor: `${pillar.color}12`, color: pillar.color }}
              >
                {pillar.tag}
              </span>

              <h3
                className="text-xl sm:text-2xl font-bold font-display mb-3 leading-tight"
                style={{ color: pillar.color }}
              >
                {pillar.title}
              </h3>

              <p className="text-[var(--landing-text-muted)] text-sm mb-6 leading-relaxed">
                {pillar.desc}
              </p>

              <ul className="space-y-3">
                {pillar.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: pillar.color }}
                    >
                      ✓
                    </span>
                    <span className="text-[var(--landing-text-dark)] leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
