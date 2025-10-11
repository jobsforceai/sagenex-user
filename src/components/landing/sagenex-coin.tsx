// components/SgCoinSection.tsx
"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";

type Props = {
  id?: string;
  src?: string; // coin image (transparent PNG)
};

export default function SgCoinSection({ id = "sgcoin", src = "/logo5.png" }: Props) {
  return (
    <section id={id} className="relative overflow-hidden bg-[#060B09] text-white">
      <Aurora />
      <GodRays />
      <Particles />

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        {/* Title + Launching Soon */}
        <header className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.45 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-300" />
            Launching Soon
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="text-[clamp(36px,7vw,80px)] font-extrabold leading-[1.05] tracking-tight"
          >
            SGCOIN
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className={`mx-auto mt-2 max-w-2xl text-balance text-transparent bg-clip-text bg-gradient-to-r ${GOLD}`}
          >
            Made Decentralized • Reserved by Sagenex
          </motion.p>
        </header>

        <CoinHero src={src} />

        {/* micro features — minimal text */}
        <motion.ul
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-30 grid max-w-6xl grid-cols-2 gap-3 text-center sm:grid-cols-4"
        >
          {[
            ["Decentralized", "On-chain governance"],
            ["Utility", "PMS • E-Wallet • Bots"],
            ["Security", "Audited contracts"],
            ["Velocity", "Fast • Low fees"],
          ].map(([t, s]) => (
            <li
              key={t}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur shadow-[0_12px_40px_rgba(0,0,0,.35)]"
            >
              <div className={`mx-auto mb-2 h-1 w-12 rounded-full bg-gradient-to-r ${GOLD}`} />
              <div className="text-sm font-semibold">{t}</div>
              <div className="mt-0.5 text-xs text-white/70">{s}</div>
            </li>
          ))}
        </motion.ul>

        {/* Waitlist (replaces buttons) */}
        <motion.form
          onSubmit={(e) => e.preventDefault()}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          aria-label="Join SGCOIN waitlist"
          className="mx-auto mt-8 flex max-w-md items-stretch gap-2"
        >
          <input
            type="email"
            required
            placeholder="your@email.com"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-yellow-300/30 focus:ring-2"
          />
          <button
            type="submit"
            className={`rounded-xl px-4 py-3 text-sm font-semibold text-black bg-gradient-to-r ${GOLD} hover:brightness-95 active:brightness-90`}
          >
            Join Waitlist
          </button>
        </motion.form>

        <p className="mt-4 text-center text-xs text-white/60">
          Be first to mint. Early supporters receive exclusive perks.
        </p>
      </div>
    </section>
  );
}

/* ---------------- COIN HERO (descent + tilt) ---------------- */
function CoinHero({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useTransform(ry, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(rx, [-0.5, 0.5], [-10, 10]);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rx.set((e.clientX - r.left) / r.width - 0.5);
    ry.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="relative mx-auto mt-10 h-[480px] w-full max-w-[560px]"
    >
      {/* emerald aura */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.85 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/15 blur-[60px]"
      />
      {/* outer golden glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 14 }}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          boxShadow:
            "0 0 140px 20px rgba(252, 231, 154, 0.18), inset 0 0 80px rgba(182,126,32,.15)",
        }}
      />

      {/* coin descent */}
      <motion.div
        style={{ rotateX, rotateY }}
        initial={{ y: -240, scale: 0.7, rotateZ: -10, opacity: 0 }}
        whileInView={{
          y: 0,
          scale: 1,
          rotateZ: 0,
          opacity: 1,
          transition: { delay: 0.15, type: "spring", stiffness: 110, damping: 14 },
        }}
        viewport={{ once: true, amount: 0.6 }}
        whileHover={{ scale: 1.03 }}
        className="relative drop-shadow-[0_40px_90px_rgba(0,0,0,.55)]"
      >
        <Image
          src={src}
          alt="SGCOIN Emblem"
          width={900}
          height={900}
          priority
          className="mx-auto h-auto w-full select-none"
        />
        {/* glints */}
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="pointer-events-none absolute -left-10 -top-10 block h-24 w-24 rounded-full bg-yellow-200/40 blur-2xl"
        />
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.0 }}
          className="pointer-events-none absolute -right-8 top-8 block h-20 w-20 rounded-full bg-yellow-300/30 blur-2xl"
        />
      </motion.div>

      {/* pedestal */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-[68%] -translate-x-1/2 rounded-full bg-black/60 blur-md"
      />
    </div>
  );
}

/* --------------- DECOR LAYERS (unchanged) --------------- */
function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(65% 90% at 50% -10%, rgba(16,185,129,.20), transparent 60%), radial-gradient(45% 60% at 90% 0%, rgba(0,120,80,.20), transparent 60%)",
      }}
    />
  );
}

function GodRays() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute right-[6%] top-[-8%] h-[60vh] w-[28vw] rotate-[16deg] bg-[conic-gradient(from_200deg_at_50%_0%,rgba(252,231,154,.28),rgba(252,231,154,0)_55%)] blur-2xl" />
      <div className="absolute right-[10%] top-[-10%] h-[60vh] w-[20vw] rotate-[18deg] bg-[conic-gradient(from_210deg_at_50%_0%,rgba(245,192,78,.24),rgba(245,192,78,0)_60%)] blur-2xl" />
    </div>
  );
}

function Particles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(36)].map((_, i) => (
        <span
          key={i}
          className="absolute h-[2px] w-[2px] rounded-full bg-yellow-200/80"
          style={{
            top: `${Math.random() * 90 + 2}%`,
            left: `${Math.random() * 90 + 5}%`,
            animation: `sg_float ${6 + Math.random() * 6}s ease-in-out ${
              Math.random() * 2
            }s infinite`,
            opacity: 0.7,
            filter: "blur(0.3px)",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes sg_float {
          0% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
          100% { transform: translateY(0) }
        }
      `}</style>
    </div>
  );
}
