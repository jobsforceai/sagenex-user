// MarqueeHindi.tsx
"use client";
import { motion } from "framer-motion";
import React from "react";

type Props = {
  speed?: number;     // seconds for one loop
  tilt?: number;      // degrees
  className?: string; // extra tailwind
};

const PHRASE = "level सबके निकालेंगे";

export default function MarqueeHindi({ speed = 20, tilt = 4, className = "" }: Props) {
  return (
    <section className={`relative w-full overflow-hidden py-6 ${className}`} aria-label="Hindi marquee">
      {/* slight tilt */}
      <div className="select-none" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="relative -mx-8">
          {/* edge fades (optional) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0b0f0c] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0b0f0c] to-transparent" />

          {/* SINGLE ROW, infinite loop */}
          <div className="relative h-24 sm:h-28 md:h-32 overflow-hidden">
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex"
              aria-hidden="true"
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}           // move half a lane
              transition={{ repeat: Infinity, ease: "linear", duration: speed }}
              style={{ willChange: "transform" }}
            >
              {/* Two copies of the same lane in a SINGLE row -> seamless wrap */}
              <Lane />
              <Lane />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Lane() {
  const row = Array.from({ length: 12 }, () => PHRASE);
  const base =
    "flex shrink-0 items-center gap-8 px-10 text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight";
  const text =
    "text-transparent bg-clip-text bg-gradient-to-r from-[#f1d27a] via-[#e6c372] to-[#b58a2b] drop-shadow-[0_1px_0_rgba(0,0,0,.35)]";

  return (
    <div className={base}>
      {row.map((t, i) => (
        <span key={i} className={`${text} whitespace-nowrap`}>
          {t}
          <span className="mx-6 align-middle text-white/30">•</span>
        </span>
      ))}
    </div>
  );
}
