"use client";

import { motion } from "framer-motion";

type Tier = { tier: string; price: number; items: string[]; goal: string };

const DATA: Tier[] = [
  { tier: "Starter", price: 50, items: ["Basics of Crypto & Blockchain", "Intro to Unilevel Business Model"], goal: "Kickstart journey with foundations." },
  { tier: "Bronze", price: 100, items: ["Affiliate Marketing Basics", "Intro Wallets & Trading"], goal: "Build skills + start duplication." },
  { tier: "Silver", price: 300, items: ["Technical Analysis Basics", "Duplication Workshops"], goal: "Handle first 50–100 team members." },
  { tier: "Gold", price: 500, items: ["Leadership Blueprint", "Passive vs Active Income"], goal: "Transition to Leader Rank." },
  { tier: "Platinum", price: 1000, items: ["Market Analysis", "Compliance & Taxation Basics"], goal: "Prepare for Manager Rank (1,000+ teams)." },
  { tier: "Titanium", price: 2500, items: ["Multi-Country Network Growth", "Mastermind Access"], goal: "Train to become Director." },
  { tier: "Diamond", price: 5000, items: ["CEO Mindset Training", "Investment Diversification"], goal: "Crown Ambassador Level." },
  { tier: "Crown", price: 10000, items: ["Elite Global Leadership Training", "Direct 1-on-1 Mentorship", "Luxury Global Summits", "Premium Business Expansion Tools"], goal: "Build global empire under SAGENEX." },
];

function getTierStyle(tier: string) {
  if (tier === "Platinum") return { accent: "#7c3aed" };
  if (tier === "Gold")     return { accent: "#b58a2b" };
  if (tier === "Silver")   return { accent: "#94a3b8" };
  if (tier === "Bronze")   return { accent: "#d97706" };
  if (tier === "Crown")    return { accent: "var(--crimson)" };
  if (tier === "Diamond")  return { accent: "#0ea5e9" };
  if (tier === "Titanium") return { accent: "#64748b" };
  return { accent: "var(--emerald)" }; // Starter
}

export default function SagenexAcademy() {
  return (
    <section id="academy" className="section-dark w-full py-24 md:py-32 relative overflow-hidden border-t border-[var(--border-dark)]">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="eyebrow mb-4">Sagenex Academy</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2 className="display-headline text-[var(--text-primary-dark)]">
              Learn, Earn<br />
              <span className="text-[var(--crimson)]">&amp; Lead.</span>
            </h2>
            <p className="text-[var(--text-muted-dark)] max-w-sm leading-relaxed lg:text-right">
              Eight progressive tracks from Starter to Crown — turning beginners into confident global leaders.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {DATA.map((c, i) => {
            const { accent } = getTierStyle(c.tier);
            return (
              <motion.article
                key={c.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card flex flex-col group hover:border-white/20 transition-all duration-300"
              >
                <div className="px-6 py-5 border-b border-[var(--border-dark)] relative overflow-hidden rounded-t-[24px]">
                  <div className="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20" style={{ backgroundColor: accent }} />
                  <span className="text-[11px] font-bold tracking-widest uppercase block mb-2" style={{ color: accent }}>
                    {c.tier}
                  </span>
                  <span className="text-3xl font-display font-extrabold text-white">
                    ${c.price.toLocaleString()}
                  </span>
                </div>

                <div className="px-6 py-5 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {c.items.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-[var(--text-muted-dark)]">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full shrink-0" style={{ background: accent }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-[var(--text-muted-dark)] border-t border-[var(--border-dark)] pt-4">
                    <strong style={{ color: accent }}>Goal: </strong>{c.goal}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
