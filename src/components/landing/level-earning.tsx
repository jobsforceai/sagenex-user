"use client";
import { motion, Variants } from "framer-motion";
import React, { useMemo } from "react";
import { FiUser } from "react-icons/fi";
import InvestorVsLeader from "./investor-leader";

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
    id="earning"
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

      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto text-center"
        >
          <h1
            className="text-[clamp(40px,8vw,96px)] font-extrabold tracking-tight text-left
                       text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-white"
          >
            Earning Model
          </h1>

          {/* <p className="mt-4 max-w-4xl text-right text-[17px] text-[#bfcfc3]">
            Sagenex offers two earning paths: <strong className="text-white">Investor</strong> (passive) gains ROI from investment
            pools, capped at <strong className="text-white">2.5×</strong> capital—reinvest to continue. <strong className="text-white">Business Leader</strong>
            (active) earns ROI <em>plus</em> Direct Bonus and Unilevel incentives, with potential up to <strong className="text-white">4×</strong>
            capital, sustained by team activity. Choose packages from <strong className="text-white">$50–$10,000</strong> with monthly ROI, daily
            caps, and reinvest options. Duplicate smartly to scale multi-level bonuses.
          </p> */}
          <p className="mt-6 sm:mt-8 max-w-4xl text-center md:text-right md:ml-auto text-[15px] sm:text-[17px] text-white/85">
            <span className="font-semibold text-emerald-300">SAGENEX</span> offers two earning paths: <strong className="text-white">Investor</strong> (passive) gains ROI from investment
            pools, capped at <strong className="text-white">2.5×</strong> capital—reinvest to continue. <strong className="text-white">Business Leader</strong>
            (active) earns ROI <em>plus</em> Direct Bonus and Unilevel incentives, with potential up to <strong className="text-white">4×</strong>
            capital, sustained by team activity. Choose packages from <strong className="text-white">$50–$10,000</strong> with monthly ROI, daily
            caps, and reinvest options. Duplicate smartly to scale multi-level bonuses.
          </p>

          <div>
            <InvestorVsLeader />
          </div>
          <h2
            id="levels-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Duplication Levels —{" "}
            <span className="text-[#d4b36a]">How Earnings Grow Exponentially</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#b6c8bf]">
            You (Top Node) bring <span className="font-semibold text-white">6 directs</span>.
            Each of them brings 6 — creating <span className="text-[#d4b36a] font-semibold">exponential duplication</span> down to Level 6.
          </p>
        </motion.div>

        {/* Layout: Left Pyramid + Right Table */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
          {/* Pyramid visual (hidden on mobile, shown on larger screens) */}
          <div className="hidden lg:flex flex-col items-center justify-start gap-2">
            {/* Compact pyramid: configurable small icon counts per row so 6 rows fit */}
            {/* icons: YOU, L1, L2, L3, L4, L5 */}
            {/* Using requested pattern where L2 has 2 icons, L3 has 3 icons; adjusted array below */}
            {/** iconCounts length controls how many rows are shown here (we keep 6) */}
            {(() => {
              const ICON_COUNTS = [1, 1, 2, 3, 5, 7];
              return ICON_COUNTS.map((icons, i) => {
                const label = i === 0 ? "YOU (TOP NODE)" : `L${i}`;
                const members = i === 0 ? 1 : LEVELS[i - 1]?.members ?? 0;
                return (
                  <React.Fragment key={i}>
                    <PyramidIcon label={label} icons={icons} members={members} />
                    {i < ICON_COUNTS.length - 1 && <Arrow />}
                  </React.Fragment>
                );
              });
            })()}
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
            <div className="grid grid-cols-4 items-center bg-gradient-to-b from-[#d4b36a] to-[#b58a2b] px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-extrabold tracking-wide text-black sm:text-base">
              <div>Level</div>
              <div className="text-right">Members</div>
              <div className="text-right hidden sm:block">Package Value ($)</div>
              <div className="text-right sm:hidden">Package ($)</div>
              <div className="text-right hidden sm:block">% / Your Bonus ($)</div>
              <div className="text-right sm:hidden">Bonus ($)</div>
            </div>

            {/* Body */}
            <div className="divide-y divide-white/10">
              {rows.map((r) => (
                <motion.div
                  key={r.level}
                  variants={rowAnim}
                  className="grid grid-cols-4 items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[#d8e8e0] sm:text-base"
                >
                  <div className="font-semibold text-white">{r.level}</div>
                  <div className="text-right text-xs sm:text-base">{nf(r.members)}</div>
                  <div className="text-right text-xs sm:text-base">${nf(r.packageValue)}</div>
                  <div className="text-right">
                    <span className="text-white/80 hidden sm:inline">
                      {(r.rate * 100).toFixed(0)}%
                    </span>{" "}
                    <span className="ml-0 sm:ml-2 font-bold text-emerald-300 text-xs sm:text-base">
                      ${nf(r.bonus)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Totals row */}
            <div className="grid grid-cols-4 items-center bg-[#0b1220]/80 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-white sm:text-base">
              <div>TOTAL</div>
              <div className="text-right text-xs sm:text-base">{nf(totals.members)}</div>
              <div className="text-right text-xs sm:text-base">${nf(totals.packageValue)}</div>
              <div className="text-right text-lg sm:text-2xl text-[#f0d493]">
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
  members,
  icons = 1,
}: {
  label: string;
  members: number;
  icons?: number;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: icons }).map((_, i) => (
          <FiUser
            key={i}
            className="h-5 w-5 sm:h-6 sm:w-6 text-[#f0d493] drop-shadow-sm"
          />
        ))}
      </div>
      <div className="mt-1 text-[10px] sm:text-[11px] font-semibold tracking-wide text-white/80">
        {label}
      </div>
      <div className="mt-0.5 text-[10px] sm:text-[11px] text-[#d4b36a] font-semibold">{members.toLocaleString()} members</div>
    </div>
  );
}

function Arrow() {
  return <div className="text-[#d4b36a] text-lg">↓</div>;
}
