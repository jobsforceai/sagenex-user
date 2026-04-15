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
  if (tier === "Platinum") return { accent: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" };
  if (tier === "Gold")     return { accent: "#b58a2b", bg: "#fffbeb", border: "#fde68a" };
  if (tier === "Silver")   return { accent: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
  if (tier === "Bronze")   return { accent: "#92400e", bg: "#fff7ed", border: "#fed7aa" };
  if (tier === "Crown")    return { accent: "#0a0a0a", bg: "#fafafa", border: "#d4d4d4" };
  if (tier === "Diamond")  return { accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" };
  if (tier === "Titanium") return { accent: "#475569", bg: "#f8fafc", border: "#cbd5e1" };
  return { accent: "#00b386", bg: "#f0fdf9", border: "#99f6e4" }; // Starter
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 22 } },
};

export default function SagenexAcademy() {
  return (
    <section id="academy" className="w-full bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="eyebrow mb-4">Sagenex Academy</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2
              className="font-extrabold text-[#0a0a0a] leading-[0.95]"
              style={{ fontSize: "clamp(40px, 5.5vw, 80px)", letterSpacing: "-0.03em" }}
            >
              Learn, Earn<br />
              <span className="text-[#00b386]">&amp; Lead.</span>
            </h2>
            <p className="text-[16px] text-[#666] max-w-sm leading-relaxed lg:text-right">
              Eight progressive tracks from Starter to Crown — turning beginners into confident global leaders.
            </p>
          </div>
        </motion.div>

        {/* ── Tier grid ── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {DATA.map((c) => {
            const { accent, bg, border } = getTierStyle(c.tier);
            return (
              <motion.article
                key={c.tier}
                variants={item}
                whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
                className="rounded-2xl border overflow-hidden flex flex-col bg-white transition-shadow"
                style={{ borderColor: border }}
              >
                {/* Tier header */}
                <div
                  className="px-5 py-4 flex items-baseline justify-between"
                  style={{ background: bg, borderBottom: `1px solid ${border}` }}
                >
                  <div>
                    <span
                      className="text-[11px] font-bold tracking-widest uppercase block mb-1"
                      style={{ color: accent }}
                    >
                      {c.tier}
                    </span>
                    <span
                      className="text-3xl font-extrabold"
                      style={{ color: accent, letterSpacing: "-0.03em" }}
                    >
                      ${c.price.toLocaleString()}
                    </span>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: accent + "14", color: accent }}
                  >
                    E-Wallet
                  </span>
                </div>

                {/* Body */}
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <ul className="space-y-2 flex-1 mb-4">
                    {c.items.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-[#555]">
                        <span
                          className="mt-[5px] h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ background: accent }}
                        />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[12px] text-[#999] border-t border-[#f0f0f0] pt-3 leading-snug">
                    <span className="font-semibold" style={{ color: accent }}>Goal: </span>
                    {c.goal}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ── Footer chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[
            "Learn + Earn model at all levels",
            "E-Wallet = Package value (no-risk learning)",
            "Recognition at each level with perks",
          ].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-2 text-[13px] text-[#555] bg-[#f5f5f5] rounded-full px-4 py-2 border border-[#e8e8e8]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b386] shrink-0" />
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
