"use client";

import { motion } from "framer-motion";

const PILLARS = [
  {
    title: "Gold 11-Month Scheme",
    tag: "Exclusive",
    desc: "For existing users. Monthly entry between ₹10,000 and ₹1,00,000.",
    features: [
      "Gold Option: 3X Bonus + maturity in physical gold",
      "Cash Option: 4X Bonus + cash payout"
    ],
    color: "var(--crimson)"
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
    color: "var(--emerald)"
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
    color: "#6366f1"
  }
];

export default function InvestmentPillars() {
  return (
    <section id="investment-pillars" className="section-dark w-full py-24 md:py-32 border-t border-[var(--border-dark)] relative">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="eyebrow mb-4">Capital Deployment</p>
          <h2 className="display-headline max-w-3xl mx-auto">
            Our Investment <span className="text-[var(--crimson)]">Pillars</span>
          </h2>
          <p className="text-[var(--text-muted-dark)] mt-6 max-w-2xl mx-auto">
            Structured, capped, and diversified. We deploy capital across strictly managed verticals to ensure maximum ecosystem safety.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="glass-card p-8 relative overflow-hidden group hover:border-[var(--border-light)] transition-colors"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at top right, ${pillar.color}, transparent 60%)` }}
              />
              
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
                style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
              >
                {pillar.tag}
              </span>
              
              <h3 className="text-2xl font-bold font-display mb-4 text-[var(--crimson)] leading-tight">
                {pillar.title}
              </h3>
              
              <p className="text-[var(--text-muted-dark)] text-sm mb-8 leading-relaxed">
                {pillar.desc}
              </p>
              
              <ul className="space-y-4">
                {pillar.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="mt-1 flex-shrink-0 text-black">✓</span>
                    <span className="leading-relaxed text-black">{feature}</span>
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
