"use client";
import { motion, Variants } from "framer-motion";
import React, { useMemo } from "react";
import { FiUser } from "react-icons/fi";

type LevelRow = {
  level: string;
  members: number;
  rate: number; // % you earn at this level
};

const LEVELS: LevelRow[] = [
  { level: "L1", members: 6, rate: 0.10 },
  { level: "L2", members: 36, rate: 0.06 },
  { level: "L3", members: 216, rate: 0.05 },
  { level: "L4", members: 1296, rate: 0.04 },
  { level: "L5", members: 7776, rate: 0.03 },
  { level: "L6", members: 46656, rate: 0.02 },
];

// Each member package value (USD)
const PACKAGE_USD = 1000;

const container: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const rowAnim: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 20 },
  },
};

export default function LevelsEarnings() {
  const rows = useMemo(() => {
    return LEVELS.map((r) => {
      const packageValue = r.members * PACKAGE_USD;
      const bonus = packageValue * r.rate;
      return { ...r, packageValue, bonus };
    });
  }, []);

  const totals = useMemo(() => {
    const members = rows.reduce((a, r) => a + r.members, 0);
    const packageValue = rows.reduce((a, r) => a + r.packageValue, 0);
    const bonus = rows.reduce((a, r) => a + r.bonus, 0);
    return { members, packageValue, bonus };
  }, [rows]);

  const nf = (n: number) => n.toLocaleString();

  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="levels-heading"
    >
      {/* background gradient transition */}
      <div className="absolute inset-0 -z-10 bg-black from-[#0b0f0c] via-[#0f1411] to-[#18231d]" />
      <div
        className="absolute inset-0 -z-10 opacity-25"
        style={{
          background:
            "radial-gradient(1000px 500px at 85% 20%, rgba(212,179,106,.3), transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2
            id="levels-heading"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Duplication Levels —{" "}
            <span className="text-[#d4b36a]">How Earnings Grow Exponentially</span>
          </h2>
          <p className="mt-3 text-[#b6c8bf]">
            You (Top Node) bring <span className="font-semibold text-white">6 directs</span>.
            Each of them brings 6 — creating <span className="text-[#d4b36a] font-semibold">exponential duplication</span> down to Level 6.
          </p>
        </motion.div>

        {/* Layout: Left Pyramid + Right Table */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
          {/* Pyramid visual (hidden on small screens) */}
          <div className="hidden lg:flex flex-col items-center justify-start gap-6">
            <PyramidIcon label="YOU (TOP NODE)" count={1} />
            <Arrow />
            <PyramidIcon label="L2" count={2} />
            <Arrow />
            <PyramidIcon label="L3" count={3} />
            <Arrow />
            <PyramidIcon label="L4" count={4} />
          </div>

          {/* Table */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="overflow-hidden rounded-xl border border-white/10 bg-[#0f1411]/70 backdrop-blur"
          >
            {/* Header */}
            <div className="grid grid-cols-4 items-center bg-gradient-to-b from-[#d4b36a] to-[#b58a2b] px-4 py-3 text-sm font-extrabold tracking-wide text-black sm:text-base">
              <div>Level</div>
              <div className="text-right">Members</div>
              <div className="text-right">Package Value ($)</div>
              <div className="text-right">% / Your Bonus ($)</div>
            </div>

            {/* Body */}
            <div className="divide-y divide-white/10">
              {rows.map((r) => (
                <motion.div
                  key={r.level}
                  variants={rowAnim}
                  className="grid grid-cols-4 items-center px-4 py-3 text-sm text-[#d8e8e0] sm:text-base"
                >
                  <div className="font-semibold text-white">{r.level}</div>
                  <div className="text-right">{nf(r.members)}</div>
                  <div className="text-right">${nf(r.packageValue)}</div>
                  <div className="text-right">
                    <span className="text-white/80">
                      {(r.rate * 100).toFixed(0)}%
                    </span>{" "}
                    <span className="ml-2 font-bold text-emerald-300">
                      ${nf(r.bonus)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-4 items-center bg-[#0b1220]/80 px-4 py-4 text-sm font-extrabold text-white sm:text-base">
              <div>TOTAL</div>
              <div className="text-right">{nf(totals.members)}</div>
              <div className="text-right">${nf(totals.packageValue)}</div>
              <div className="text-right text-2xl text-[#f0d493]">
                ${nf(totals.bonus)}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- Helpers ------------------ */

function PyramidIcon({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <FiUser
            key={i}
            className="h-10 w-10 text-[#f0d493] drop-shadow-lg"
          />
        ))}
      </div>
      <div className="mt-2 text-xs font-bold tracking-wide text-white/80">
        {label}
      </div>
    </div>
  );
}

function Arrow() {
  return <div className="text-[#d4b36a] text-lg">↓</div>;
}
