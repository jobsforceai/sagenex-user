"use client";

import { motion } from "framer-motion";
import { Crown, Sparkles, Star, Gem, Trophy, Zap } from "lucide-react";

type Tier = {
  key: string;
  label: string;
  badge: string;
  description: string;
  icon: typeof Crown;
  /** Hex color for the tier accent (badge, icon, big numbers). Picked to pop on dark inner cards. */
  accent: string;
  /** Soft glow color used for icon shadow + card hover. */
  glow: string;
  ids: { id: string; price: number }[];
};

// Mock catalog. Every ID is strictly ABOVE the current user-id counter
// (U13517 at time of writing) so nothing here is already taken. The real
// list will be generated server-side from the live counter once the
// catalog/reservation logic lands.
const TIERS: Tier[] = [
  {
    key: "five-repeat",
    label: "Five-Repeat",
    badge: "Legendary",
    description: "The same digit, five times. Rare and unforgettable.",
    icon: Crown,
    accent: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.45)",
    ids: [
      { id: "U99999", price: 100000 },
      { id: "U88888", price: 75000 },
      { id: "U77777", price: 60000 },
      { id: "U55555", price: 50000 },
      { id: "U33333", price: 40000 },
      { id: "U22222", price: 40000 },
    ],
  },
  {
    key: "big-round",
    label: "Big Round",
    badge: "Iconic",
    description: "Huge round numbers — instantly memorable status.",
    icon: Trophy,
    accent: "#FB923C",
    glow: "rgba(251, 146, 60, 0.4)",
    ids: [
      { id: "U100000", price: 50000 },
      { id: "U50000",  price: 30000 },
      { id: "U40000",  price: 20000 },
      { id: "U30000",  price: 20000 },
      { id: "U20000",  price: 15000 },
    ],
  },
  {
    key: "palindrome",
    label: "Palindrome",
    badge: "Elite",
    description: "Reads the same forwards and backwards.",
    icon: Gem,
    accent: "#10B981",
    glow: "rgba(16, 185, 129, 0.4)",
    ids: [
      { id: "U20002", price: 15000 },
      { id: "U24642", price: 10000 },
      { id: "U23432", price: 10000 },
      { id: "U15151", price: 8000 },
      { id: "U14141", price: 8000 },
    ],
  },
  {
    key: "round-1000",
    label: "Round Number",
    badge: "Signature",
    description: "Clean thousands — easy to share, easy to remember.",
    icon: Star,
    accent: "#0EA5E9",
    glow: "rgba(14, 165, 233, 0.4)",
    ids: [
      { id: "U25000", price: 12000 },
      { id: "U18000", price: 8000 },
      { id: "U17000", price: 6000 },
      { id: "U16000", price: 6000 },
      { id: "U15000", price: 7000 },
      { id: "U14000", price: 7000 },
    ],
  },
  {
    key: "sequence",
    label: "Sequential",
    badge: "Stylish",
    description: "Pretty ascending digits — classic appeal.",
    icon: Sparkles,
    accent: "#A855F7",
    glow: "rgba(168, 85, 247, 0.4)",
    ids: [
      { id: "U13579", price: 8000 },
      { id: "U23456", price: 7000 },
      { id: "U34567", price: 6000 },
      { id: "U45678", price: 6000 },
      { id: "U56789", price: 6000 },
      { id: "U67890", price: 6000 },
    ],
  },
  {
    key: "mirror-pair",
    label: "Mirror Pair",
    badge: "Fancy",
    description: "Repeating two-digit patterns (xy-xy).",
    icon: Zap,
    accent: "#EC4899",
    glow: "rgba(236, 72, 153, 0.4)",
    ids: [
      { id: "U14014", price: 4000 },
      { id: "U15015", price: 4000 },
      { id: "U17017", price: 4000 },
      { id: "U20020", price: 4500 },
      { id: "U25025", price: 4500 },
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
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-[var(--crimson)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-20 h-72 w-72 rounded-full bg-[#F59E0B]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Header — matches existing landing typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="eyebrow mb-4">Limited Edition</p>
          <h2 className="display-headline mx-auto max-w-3xl">
            Own a <span className="text-[var(--crimson)]">Fancy User ID</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[var(--text-muted-dark)]">
            Stand out in the network with a premium ID number that&apos;s memorable, prestigious, and entirely yours.
            Hand-picked tiers — pay once, keep forever.
          </p>
        </motion.div>

        {/* Tiers */}
        <div className="space-y-8">
          {TIERS.map((tier, tIdx) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: Math.min(tIdx * 0.05, 0.2) }}
                className="glass-card relative overflow-hidden p-6 md:p-8"
              >
                {/* Tier header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-light)] pb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        background: `${tier.accent}15`,
                        border: `1px solid ${tier.accent}40`,
                        boxShadow: `0 8px 28px ${tier.glow}`,
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: tier.accent }} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-2xl font-bold text-[var(--foreground)]">
                          {tier.label}
                        </h3>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                          style={{
                            color: tier.accent,
                            background: `${tier.accent}15`,
                            border: `1px solid ${tier.accent}50`,
                          }}
                        >
                          {tier.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-muted-dark)]">{tier.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted-dark)]">
                      Starting at
                    </p>
                    <p className="mt-1 text-xl font-black" style={{ color: tier.accent }}>
                      {formatINR(Math.min(...tier.ids.map(i => i.price)))}
                    </p>
                  </div>
                </div>

                {/* IDs grid — dark inner cards so the colored numbers really pop on the light section bg */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {tier.ids.map((entry) => (
                    <FancyIdCard
                      key={entry.id}
                      id={entry.id}
                      price={entry.price}
                      accent={tier.accent}
                      glow={tier.glow}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <p className="text-sm text-[var(--text-muted-dark)]">
            Looking for something specific?{" "}
            <span className="font-semibold text-[var(--foreground)]">Reach out to support</span>{" "}
            — custom-pick from currently available IDs.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FancyIdCard({
  id,
  price,
  accent,
  glow,
}: {
  id: string;
  price: number;
  accent: string;
  glow: string;
}) {
  return (
    <button
      type="button"
      className="group relative flex flex-col items-center overflow-hidden rounded-2xl border bg-[#0a0a0a] p-4 transition hover:-translate-y-0.5 md:p-5"
      style={{ borderColor: `${accent}30` }}
    >
      {/* Hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -top-12 h-24 rounded-full opacity-0 blur-2xl transition group-hover:opacity-100"
        style={{ background: glow }}
      />

      <span
        className="relative text-2xl font-black tracking-tight md:text-3xl"
        style={{ color: accent, textShadow: `0 0 24px ${glow}` }}
      >
        {id}
      </span>
      <span className="relative mt-2 text-sm font-bold text-white">
        ₹{price.toLocaleString("en-IN")}
      </span>
      <span className="relative -mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
        one-time
      </span>

      <span
        className="relative mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white opacity-0 transition group-hover:opacity-100"
        style={{ background: accent }}
      >
        Reserve
      </span>
    </button>
  );
}
