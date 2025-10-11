// components/RanksSection.tsx
"use client";

import { motion } from "framer-motion";
import {
  User,
  Shield,
  Trophy,
  Star,
  Medal,
  Crown,
} from "lucide-react";

type Rank = {
  level: number;
  title: string;
  icon: "user" | "shield" | "trophy" | "star" | "medal" | "crown";
  requirement: string;
  business?: string;
  legRule?: string;
  duration?: string;
  salaryLabel: string;
  tint: string; // Tailwind text color class for icon headline
};

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";

const RANKS: Rank[] = [
  {
    level: 1,
    title: "Starter",
    icon: "user",
    requirement: "6 directs",
    legRule: "Recognition: Bronze Badge / Starter Rank",
    salaryLabel: "— (commissions only)",
    tint: "text-sky-300",
  },
  {
    level: 2,
    title: "Builder",
    icon: "shield",
    requirement: "6 directs + 36 active team members",
    business: "$10,000 monthly team business",
    legRule: "Min. 2 legs with $3,000 each",
    duration: "6 months (Renewed on performance)",
    salaryLabel: "$600 / month",
    tint: "text-orange-300",
  },
  {
    level: 3,
    title: "Leader",
    icon: "trophy",
    requirement: "200+ active team members",
    business: "$20,000 monthly team business",
    legRule: "Min. 3 legs with $5,000 each",
    duration: "12 months (Renewed on performance)",
    salaryLabel: "$1,200 / month",
    tint: "text-yellow-300",
  },
  {
    level: 4,
    title: "Manager",
    icon: "star",
    requirement: "1,000+ active team members",
    business: "$50,000 monthly team business",
    legRule: "Min. 3 legs with $10,000 each",
    duration: "12 months (Renewed on performance)",
    salaryLabel: "$2,400 / month",
    tint: "text-amber-300",
  },
  {
    level: 5,
    title: "Director",
    icon: "medal",
    requirement: "7,000+ active team members",
    business: "$150,000 monthly team business",
    legRule: "Min. 4 legs with $30,000 each",
    duration: "12 months (Renewed on performance)",
    salaryLabel: "$3,600 / month",
    tint: "text-rose-300",
  },
  {
    level: 6,
    title: "Crown",
    icon: "crown",
    requirement: "46,000+ active team members",
    business: "$300,000 monthly team business",
    legRule: "Min. 5 legs with $50,000 each",
    duration: "12 months (Renewed on performance)",
    salaryLabel: "$6,000 / month",
    tint: "text-emerald-300",
  },
];

const SAFEGUARDS = [
  {
    title: "Grace Period",
    text: "Miss 1 month → 50% salary. Miss 2 months → Salary paused.",
  },
  {
    title: "Reactivation Bonus",
    text: "Regain lost salary next month when business resumes.",
  },
  {
    title: "ROI Cap",
    text: "Passive investors capped at 2.5× (must re-invest).",
  },
];

function RankIcon({ name, className }: { name: Rank["icon"]; className?: string }) {
  const props = { className, "aria-hidden": true } as const;
  switch (name) {
    case "user":
      return <User {...props} />;
    case "shield":
      return <Shield {...props} />;
    case "trophy":
      return <Trophy {...props} />;
    case "star":
      return <Star {...props} />;
    case "medal":
      return <Medal {...props} />;
    case "crown":
      return <Crown {...props} />;
  }
}

export default function RanksSection() {
  return (
    <section className="relative overflow-hidden bg-[#07140E] text-white">
      {/* mood layers */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 70% at 15% 5%, rgba(16,185,129,.08), transparent 60%), radial-gradient(60% 60% at 85% 35%, rgba(0,120,80,.07), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.04)_1px,transparent_2px)] bg-[length:42px_100%] opacity-15" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45 }}
          className="mb-10 md:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            <span className="text-white">SAGENEX Ranks & Salary Structure</span>{" "}
            <span className="text-white/60 text-lg align-middle block md:inline">
              (With Active Conditions)
            </span>
          </h2>
          {/* <div className={`mt-3 h-[3px] w-44 rounded-full bg-gradient-to-r ${GOLD}`} /> */}
        </motion.header>

        {/* Rank Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 xl:grid-cols-3">
          {RANKS.map((r, i) => (
            <motion.article
              key={r.level}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group flex flex-col rounded-2xl border border-emerald-400/10 bg-[#0F241B]/90 backdrop-blur p-6 shadow-[0_20px_60px_rgba(0,0,0,.45)] hover:border-emerald-400/25 hover:shadow-[0_24px_70px_rgba(0,0,0,.55)] transition"
            >
              {/* Header line */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/15 p-2 ring-1 ring-emerald-400/20">
                  <RankIcon name={r.icon} className={`h-6 w-6 ${r.tint}`} />
                </div>
                <h3 className="text-lg font-semibold">
                  <span className={`mr-2 text-transparent bg-clip-text bg-gradient-to-r ${GOLD}`}>
                    Level {r.level}
                  </span>
                  <span className="text-white/90">→ {r.title}</span>
                </h3>
              </div>

              {/* Specs */}
              <dl className="mt-4 space-y-2 text-[13px] leading-6">
                <div className="grid grid-cols-[110px_1fr] gap-2 text-white/85">
                  <dt className="text-white/60">Requirement:</dt>
                  <dd>{r.requirement}</dd>
                </div>
                {r.business && (
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-white/85">
                    <dt className="text-white/60">Business:</dt>
                    <dd>{r.business}</dd>
                  </div>
                )}
                {r.legRule && (
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-white/85">
                    <dt className="text-white/60">Leg Rule:</dt>
                    <dd>{r.legRule}</dd>
                  </div>
                )}
                {r.duration && (
                  <div className="grid grid-cols-[110px_1fr] gap-2 text-white/85">
                    <dt className="text-white/60">Duration:</dt>
                    <dd>{r.duration}</dd>
                  </div>
                )}
              </dl>

              {/* Salary band */}
              <div className="mt-auto pt-5">
                <div className="relative overflow-hidden rounded-xl border border-yellow-300/20 bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-black font-extrabold">
                  {/* sheen on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 translate-x-0 bg-white/40 opacity-0 blur-md transition duration-700 group-hover:translate-x-[220%] group-hover:opacity-30"
                  />
                  <div className="text-[18px]">{r.salaryLabel}</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Safeguards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
          className="mt-12 md:mt-16"
        >
          <h4 className="text-lg font-semibold tracking-wide text-white/90">
            Additional Safeguards
          </h4>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {SAFEGUARDS.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-[0_12px_40px_rgba(0,0,0,.35)]"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${GOLD}`} />
                  <div className="font-medium text-white/90">{s.title}</div>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-white/75">{s.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none h-16 w-full bg-gradient-to-b from-transparent to-black/60" />
    </section>
  );
}
