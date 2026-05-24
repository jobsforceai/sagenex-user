"use client";

import { motion } from "framer-motion";
import { Crown, Sparkles, Star, Gem, Trophy, Zap } from "lucide-react";

type Tier = {
  key: string;
  label: string;
  badge: string;
  description: string;
  icon: typeof Crown;
  accent: string;        // text accent
  glow: string;          // shadow glow color
  ids: { id: string; price: number }[];
};

// Mock-only catalog. The real list will be generated server-side from the
// current user-id counter once the logic lands.
const TIERS: Tier[] = [
  {
    key: "single",
    label: "Single Digit",
    badge: "Legendary",
    description: "Ultra-rare. Reserved for the founders' circle.",
    icon: Crown,
    accent: "text-[#FACC15]",
    glow: "rgba(250, 204, 21, 0.35)",
    ids: [
      { id: "U7", price: 100000 },
      { id: "U9", price: 100000 },
    ],
  },
  {
    key: "double",
    label: "Double Repeat",
    badge: "Iconic",
    description: "Memorable doubles — premium status numbers.",
    icon: Trophy,
    accent: "text-[#F59E0B]",
    glow: "rgba(245, 158, 11, 0.32)",
    ids: [
      { id: "U77",  price: 35000 },
      { id: "U88",  price: 30000 },
      { id: "U99",  price: 50000 },
      { id: "U11",  price: 25000 },
    ],
  },
  {
    key: "triple",
    label: "Triple Repeat",
    badge: "Elite",
    description: "Triple-digit power numbers.",
    icon: Gem,
    accent: "text-[#10B981]",
    glow: "rgba(16, 185, 129, 0.28)",
    ids: [
      { id: "U777", price: 15000 },
      { id: "U888", price: 12000 },
      { id: "U999", price: 20000 },
      { id: "U111", price: 10000 },
      { id: "U555", price: 10000 },
    ],
  },
  {
    key: "round",
    label: "Round Number",
    badge: "Signature",
    description: "Clean round numbers — easy to remember, easy to share.",
    icon: Star,
    accent: "text-[#38BDF8]",
    glow: "rgba(56, 189, 248, 0.28)",
    ids: [
      { id: "U1000",  price: 15000 },
      { id: "U5000",  price: 12000 },
      { id: "U10000", price: 20000 },
      { id: "U25000", price: 10000 },
      { id: "U50000", price: 15000 },
    ],
  },
  {
    key: "quad",
    label: "Quad Repeat",
    badge: "Prestige",
    description: "Four-of-a-kind — quadruple symmetry.",
    icon: Sparkles,
    accent: "text-[#C084FC]",
    glow: "rgba(192, 132, 252, 0.28)",
    ids: [
      { id: "U7777", price: 7500 },
      { id: "U8888", price: 6500 },
      { id: "U9999", price: 9000 },
      { id: "U1111", price: 5000 },
    ],
  },
  {
    key: "sequence",
    label: "Sequential",
    badge: "Stylish",
    description: "Pretty ascending sequences — classic appeal.",
    icon: Zap,
    accent: "text-[#F472B6]",
    glow: "rgba(244, 114, 182, 0.28)",
    ids: [
      { id: "U1234", price: 4000 },
      { id: "U2345", price: 3500 },
      { id: "U3456", price: 3500 },
      { id: "U4567", price: 3500 },
      { id: "U6789", price: 4000 },
    ],
  },
];

const formatINR = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L` : `₹${n.toLocaleString("en-IN")}`;

export default function FancyIdsSection() {
  return (
    <section
      id="fancy-ids"
      className="section-dark relative w-full overflow-hidden border-t border-[var(--border-dark)] py-24 md:py-32"
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[var(--crimson)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-[#FACC15]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-dark)] bg-white/[0.02] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted-dark)] backdrop-blur">
            <Crown className="h-3.5 w-3.5 text-[#FACC15]" />
            Limited Edition
          </div>
          <h2 className="font-display mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
            Own a <span className="text-[var(--crimson)]">Fancy User&nbsp;ID</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--text-muted-dark)] md:text-lg">
            Stand out in the network with a premium ID number that&apos;s memorable, prestigious, and entirely yours.
            Hand-picked tiers — pay once, keep forever.
          </p>
        </motion.div>

        {/* Tiers */}
        <div className="space-y-12">
          {TIERS.map((tier, tIdx) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: Math.min(tIdx * 0.05, 0.2) }}
                className="glass-card relative p-7 md:p-10"
              >
                {/* Tier header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-dark)] pb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
                      style={{ boxShadow: `0 8px 32px ${tier.glow}` }}
                    >
                      <Icon className={`h-6 w-6 ${tier.accent}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-2xl font-bold text-white">{tier.label}</h3>
                        <span className={`rounded-full border border-current/30 bg-current/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${tier.accent}`}>
                          {tier.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-muted-dark)]">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted-dark)]">Starting at</p>
                    <p className={`mt-1 text-xl font-black ${tier.accent}`}>
                      {formatINR(Math.min(...tier.ids.map(i => i.price)))}
                    </p>
                  </div>
                </div>

                {/* IDs grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {tier.ids.map((entry) => (
                    <FancyIdCard key={entry.id} id={entry.id} price={entry.price} accent={tier.accent} glow={tier.glow} />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-col items-center text-center"
        >
          <p className="text-sm text-[var(--text-muted-dark)]">
            Looking for something specific? <span className="text-white">Reach out to support</span> — custom-pick from current free IDs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FancyIdCard({ id, price, accent, glow }: { id: string; price: number; accent: string; glow: string }) {
  return (
    <button
      type="button"
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/30 hover:bg-white/[0.06] md:p-5"
    >
      {/* Glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -top-12 h-24 rounded-full opacity-0 blur-2xl transition group-hover:opacity-100"
        style={{ background: glow }}
      />

      <span className={`relative text-2xl font-black tracking-tight md:text-3xl ${accent}`}>{id}</span>
      <span className="relative mt-2 text-xs font-bold text-white/90">{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
      <span className="relative -mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted-dark)]">INR · one-time</span>

      <span className="relative mt-3 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white opacity-0 transition group-hover:opacity-100">
        Reserve
      </span>
    </button>
  );
}
