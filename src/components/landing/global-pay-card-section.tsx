"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Globe2,
  IndianRupee,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";
import { CARD_APPLY_LABEL, CARD_APPLY_URL, CARD_FEATURES, CARD_HERO, CARD_TRUST_CHIPS } from "@/lib/card-content";
import { CardOnboardingSteps } from "./card-onboarding-steps";

const TARGET_INR = 1250;
const EASE = [0.22, 1, 0.36, 1] as const;

const FEATURE_ICONS = {
  eal6: ShieldCheck,
  tap: Wifi,
  durability: Sparkles,
  spend: Globe2,
} as const;

const TRUST_ICONS = [KeyRound, Layers, ShieldCheck] as const;

function CountUp({ to, prefix = "₹", active }: { to: number; prefix?: string; active: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const c = animate(0, to, { duration: 1.4, ease: EASE, onUpdate: (v) => setValue(Math.round(v)) });
    return c.stop;
  }, [active, to]);
  return (
    <span className="tabular-nums">
      {prefix}
      {value.toLocaleString("en-IN")}
    </span>
  );
}

function CardFront() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[26px] shadow-[0_32px_64px_rgba(15,23,42,0.3)] ring-1 ring-white/10">
      <Image
        src="/sagenex-card-front.png"
        alt="Sagenex Global Pay Card"
        fill
        priority
        sizes="(max-width: 1024px) 90vw, 440px"
        className="object-cover"
      />
      <div className="global-pay-card-sheen pointer-events-none absolute inset-0 rounded-[26px] opacity-40" />
      <div className="global-pay-card-sweep pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]" />
    </div>
  );
}

function CardBack() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[26px] shadow-[0_32px_64px_rgba(15,23,42,0.3)] ring-1 ring-white/15">
      {/* Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#141D2E] to-[#0F172A]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)",
        }}
      />
      <div className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.35)_0%,transparent_70%)] blur-2xl" />

      {/* Magnetic stripe */}
      <div className="relative z-10 mt-7 h-[52px] w-full overflow-hidden bg-[#05080F]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #0a0f18 0px, #121a28 2px, #080c14 4px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
      </div>

      <p className="relative z-10 px-6 pt-2 text-[7px] font-medium uppercase tracking-[0.12em] text-white/35">
        For customer service call support@sagenex.com
      </p>

      <div className="relative z-10 mx-6 mt-4">
        {/* Signature panel */}
        <div className="relative overflow-hidden rounded-lg bg-[#F1F5F9] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #E2E8F0 0px, #E2E8F0 1px, transparent 1px, transparent 6px)",
            }}
          />
          <div className="relative flex h-11 items-center justify-between px-4">
            <p className="font-display text-[13px] italic tracking-wide text-[#94A3B8]">Authorised Signature</p>
            <div className="flex items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-2.5 py-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#64748B]">CVV</span>
              <span className="font-mono text-sm font-bold tracking-[0.28em] text-[#0F172A]">934</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security + contactless */}
      <div className="relative z-10 mx-6 mt-5 flex items-center justify-between">
        <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#C41E3A] via-[#E85D75] to-[#9D122F]" />
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/25 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white/90" strokeWidth={2.2} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-white/50">
          <Wifi className="h-4 w-4 rotate-90" strokeWidth={2.5} />
          <span className="text-[8px] font-bold uppercase tracking-[0.14em]">Contactless</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="relative z-10 mt-auto px-6 pb-5 pt-4">
        <div className="mb-3 h-px bg-gradient-to-r from-transparent via-[#C41E3A]/50 to-transparent" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo5.png" alt="" width={22} height={22} className="h-[22px] w-[22px] brightness-0 invert" />
              <span className="text-[11px] font-black tracking-[0.2em] text-white">SAGENEX</span>
            </div>
            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#E85D75]">
              Global Pay · Platinum
            </p>
            <p className="mt-2 font-mono text-[11px] tracking-[0.2em] text-white/55">4000 0000 0000 0000</p>
          </div>
          <div className="text-right">
            <span className="font-display text-[22px] font-black italic text-white/25">VISA</span>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-white/40">Valid thru 09/30</p>
          </div>
        </div>
        <p className="mt-3 text-[8px] leading-relaxed text-white/40">
          Issued by Sagenex LLC USA, in pursuant to a license from Visa Worldwide PTE limited.
        </p>
      </div>

      <div className="global-pay-card-sheen pointer-events-none absolute inset-0 rounded-[26px] opacity-20" />
    </div>
  );
}

function PayCard3D({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const flippingRef = useRef(false);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const reducedMotion = useReducedMotion();

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const liftZ = useMotionValue(0);
  const flipY = useMotionValue(0);

  // Tilt uses X + Z only — Y axis reserved for the flip
  const rotateX = useSpring(useTransform(tiltY, [-1, 1], [14, -14]), {
    stiffness: 220,
    damping: 26,
    mass: 0.5,
  });
  const rotateZ = useSpring(useTransform(tiltX, [-1, 1], [-5, 5]), {
    stiffness: 220,
    damping: 26,
    mass: 0.5,
  });
  const flipArcZ = useTransform(flipY, (deg) => Math.sin((deg * Math.PI) / 180) * 42);
  const translateZ = useSpring(liftZ, { stiffness: 200, damping: 20 });
  const glareX = useTransform(tiltX, [-1, 1], ["22%", "78%"]);
  const glareY = useTransform(tiltY, [-1, 1], ["20%", "68%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.55) 0%, transparent 52%)`,
  );

  const onMove = (e: React.MouseEvent) => {
    if (reducedMotion || isFlipping) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    tiltX.set(Math.max(-1, Math.min(1, nx)));
    tiltY.set(Math.max(-1, Math.min(1, ny)));
  };

  const onEnter = () => {
    if (isFlipping) return;
    setHovered(true);
    liftZ.set(flipped ? 20 : 40);
  };

  const onLeave = () => {
    if (!isFlipping) {
      tiltX.set(0);
      tiltY.set(0);
    }
    liftZ.set(flipped ? 12 : 0);
    setHovered(false);
  };

  const toggleFlip = async () => {
    if (flippingRef.current) return;
    flippingRef.current = true;
    setIsFlipping(true);
    tiltX.set(0);
    tiltY.set(0);

    const next = !flipped;
    setFlipped(next);
    await animate(flipY, next ? 180 : 0, {
      duration: reducedMotion ? 0.01 : 0.72,
      ease: [0.33, 1, 0.32, 1],
    });

    liftZ.set(next ? 12 : hovered ? 40 : 0);
    setIsFlipping(false);
    flippingRef.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void toggleFlip();
    }
  };

  return (
    <div
      ref={ref}
      className="global-pay-scene relative mx-auto w-full max-w-[440px]"
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Decorative ring — behind card only */}
      <div
        className="global-pay-hero-ring pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(400px,90vw)] w-[min(400px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(196,30,58,0.2), transparent, rgba(212,179,106,0.15), transparent)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1px))",
        }}
      />

      {/* Glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.2)_0%,transparent_68%)]"
        animate={
          active
            ? hovered
              ? { opacity: 1, scale: 1.1 }
              : { opacity: [0.5, 0.75, 0.5], scale: [1, 1.04, 1] }
            : { opacity: 0, scale: 0.85 }
        }
        transition={hovered ? { duration: 0.35 } : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floor shadow */}
      <motion.div
        className="pointer-events-none absolute -bottom-10 left-1/2 z-0 h-12 w-[80%] -translate-x-1/2 rounded-full bg-[#0F172A]/15 blur-2xl"
        animate={active ? { opacity: hovered ? 0.4 : 0.25, scaleX: hovered ? 1.1 : 1 } : { opacity: 0 }}
        transition={{ duration: 0.35 }}
      />

      {/* Float wrapper — separate from tilt so transforms don't fight */}
      <motion.div
        className="relative z-10"
        animate={
          active && !hovered && !flipped && !isFlipping && !reducedMotion
            ? { y: [0, -7, 0] }
            : { y: hovered && !isFlipping ? -6 : 0 }
        }
        transition={
          active && !hovered && !flipped && !isFlipping && !reducedMotion
            ? { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.35 }
        }
      >
        <motion.div
          className="relative aspect-[1.586/1] w-full cursor-pointer select-none"
          initial={{ opacity: 0, scale: 0.88, filter: "blur(16px)" }}
          animate={
            active
              ? {
                  opacity: 1,
                  scale: hovered && !isFlipping ? 1.03 : 1,
                  filter: "blur(0px)",
                }
              : { opacity: 0, scale: 0.88, filter: "blur(16px)" }
          }
          transition={
            active
              ? { type: "spring", stiffness: 75, damping: 17, delay: 0.5 }
              : { duration: 0.3 }
          }
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Show card front" : "Show card back"}
          aria-pressed={flipped}
          aria-busy={isFlipping}
          onClick={() => void toggleFlip()}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className="global-pay-card-flip relative h-full w-full"
            style={{ rotateY: flipY, z: flipArcZ, transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="global-pay-card-tilt relative h-full w-full"
              style={{ rotateX, rotateZ, z: translateZ, transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="global-pay-card-face"
                style={{ rotateY: 0, z: 1 }}
              >
                <CardFront />
                {!flipped && !isFlipping && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-[26px]"
                    style={{ background: glareBg }}
                  />
                )}
              </motion.div>

              <motion.div
                className="global-pay-card-face"
                style={{ rotateY: 180, z: 1 }}
              >
                <CardBack />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${!flipped ? "bg-[#C41E3A]" : "bg-[#CBD5E1]"}`}
          />
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${flipped ? "bg-[#C41E3A]" : "bg-[#CBD5E1]"}`}
          />
        </div>
        <motion.p
          className="pointer-events-none text-center text-[11px] font-semibold tracking-wide text-[#94A3B8]"
          animate={{ opacity: hovered || flipped || isFlipping ? 1 : 0.6 }}
          transition={{ duration: 0.2 }}
        >
          {isFlipping
            ? "Flipping…"
            : flipped
              ? "Tap card to show front"
              : "Tap card to show back"}
        </motion.p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  active,
  delay,
  parallaxX,
  parallaxY,
  depth = 1,
}: {
  icon: typeof Zap;
  title: string;
  desc: string;
  active: boolean;
  delay: number;
  parallaxX: ReturnType<typeof useMotionValue<number>>;
  parallaxY: ReturnType<typeof useMotionValue<number>>;
  depth?: number;
}) {
  const x = useTransform(parallaxX, (v) => v * 10 * depth);
  const y = useTransform(parallaxY, (v) => v * 8 * depth);

  return (
    <motion.div
      className="global-pay-glass group rounded-2xl p-4 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)]"
      style={{ x, y }}
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE }}
      whileHover={{ y: -3, scale: 1.02 }}
    >
      <motion.span
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#C41E3A]"
        whileHover={{ rotate: 8, scale: 1.06 }}
        transition={{ type: "spring", stiffness: 280, damping: 16 }}
      >
        <Icon className="h-4 w-4" />
      </motion.span>
      <p className="mt-3 text-sm font-bold text-[#0F172A]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{desc}</p>
    </motion.div>
  );
}

function BalanceCard({
  active,
  delay,
  parallaxX,
  parallaxY,
}: {
  active: boolean;
  delay: number;
  parallaxX: ReturnType<typeof useMotionValue<number>>;
  parallaxY: ReturnType<typeof useMotionValue<number>>;
}) {
  const x = useTransform(parallaxX, (v) => v * 8);
  const y = useTransform(parallaxY, (v) => v * 6);

  return (
    <motion.div
      className="global-pay-glass rounded-2xl p-4"
      style={{ x, y }}
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: EASE }}
      whileHover={{ y: -2 }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Your balance</p>
      <div className="mt-2 flex items-center gap-2">
        <Image src="/logo5.png" alt="" width={28} height={28} className="h-7 w-7" />
        <p className="text-lg font-black text-[#0F172A]">
          <CountUp to={TARGET_INR} prefix="" active={active} /> SGC
        </p>
      </div>
      <div className="my-3 flex justify-center">
        <ArrowRight className="h-4 w-4 text-[#C41E3A]" />
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C41E3A] text-white shadow-[0_4px_12px_rgba(196,30,58,0.35)]">
          <IndianRupee className="h-4 w-4" />
        </span>
        <p className="text-xl font-black text-[#C41E3A]">
          <CountUp to={TARGET_INR} active={active} />
        </p>
      </div>
    </motion.div>
  );
}

export default function GlobalPayCardSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(sectionRef, { once: true, margin: "-40px", amount: 0.12 });
  const reveal = Boolean(inView || reducedMotion);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const bgGlowX = useSpring(useTransform(pointerX, (v) => v * 30), { stiffness: 50, damping: 22 });
  const bgGlowY = useSpring(useTransform(pointerY, (v) => v * 24), { stiffness: 50, damping: 22 });

  const onStageMove = (e: React.MouseEvent) => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pointerX.set((e.clientX - r.left) / r.width - 0.5);
    pointerY.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onStageLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      id="global-pay-card"
      className="relative overflow-hidden border-t border-[#E2E8F0] py-14 sm:py-16 lg:py-20"
      aria-labelledby="global-pay-heading"
      onMouseMove={onStageMove}
      onMouseLeave={onStageLeave}
    >
      {/* Premium background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="global-pay-hero-bg absolute inset-0" />
        <div className="global-pay-hero-mesh absolute inset-0 opacity-80" />
        <div className="global-pay-hero-noise absolute inset-0" />
        <motion.div
          className="absolute left-1/2 top-[45%] h-[min(560px,80vw)] w-[min(560px,80vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.1)_0%,transparent_65%)]"
          style={{ x: bgGlowX, y: bgGlowY }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <motion.p
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C41E3A]"
            initial={{ opacity: 0 }}
            animate={reveal ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
          >
            {CARD_HERO.eyebrow}
          </motion.p>

          <motion.h2
            id="global-pay-heading"
            className="mt-3 font-display text-[clamp(2rem,5.5vw,3.25rem)] font-black leading-[1.05] tracking-tight text-[#0F172A]"
            initial={{ opacity: 0, y: 20 }}
            animate={reveal ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
          >
            {CARD_HERO.title[0]}
            <br />
            {CARD_HERO.title[1]}
          </motion.h2>

          <motion.p
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#64748B] sm:text-base"
            initial={{ opacity: 0, y: 14 }}
            animate={reveal ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            {CARD_HERO.subtitle}
          </motion.p>

          <motion.div
            className="mt-5 flex flex-col items-center gap-1 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={reveal ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.28, ease: EASE }}
          >
            <p className="text-[15px] font-semibold text-[#0F172A]">{CARD_HERO.trustTitle}</p>
            <p className="text-[13px] text-[#64748B]">{CARD_HERO.trustSubtitle}</p>
          </motion.div>

          <motion.div
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={reveal ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.34 }}
          >
            {CARD_TRUST_CHIPS.map((label, i) => {
              const Icon = TRUST_ICONS[i] ?? ShieldCheck;
              return (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#64748B] backdrop-blur-sm sm:text-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-[#C41E3A]" />
                  {label}
                </span>
              );
            })}
          </motion.div>

          {/* <motion.div
            className="global-pay-glass mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold text-[#C41E3A]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={reveal ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.38 }}
          >
            <Zap className="h-3.5 w-3.5" />
            SG Coins convert to ₹1 at swipe
          </motion.div> */}
        </header>

        {/* Grid layout — info never behind card */}
        <div className="mt-10 lg:mt-14">
          <div className="hidden lg:grid lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-center lg:gap-x-8 lg:gap-y-10">
            <FeatureCard
              icon={FEATURE_ICONS[CARD_FEATURES[0].id]}
              title={CARD_FEATURES[0].title}
              desc={CARD_FEATURES[0].desc}
              active={reveal}
              delay={0.75}
              parallaxX={pointerX}
              parallaxY={pointerY}
              depth={0.6}
            />

            <div className="row-span-2 flex items-center justify-center px-2">
              <PayCard3D active={reveal} />
            </div>

            <FeatureCard
              icon={FEATURE_ICONS[CARD_FEATURES[1].id]}
              title={CARD_FEATURES[1].title}
              desc={CARD_FEATURES[1].desc}
              active={reveal}
              delay={0.88}
              parallaxX={pointerX}
              parallaxY={pointerY}
              depth={0.6}
            />

            <FeatureCard
              icon={FEATURE_ICONS[CARD_FEATURES[2].id]}
              title={CARD_FEATURES[2].title}
              desc={CARD_FEATURES[2].desc}
              active={reveal}
              delay={1}
              parallaxX={pointerX}
              parallaxY={pointerY}
              depth={0.6}
            />

            <FeatureCard
              icon={FEATURE_ICONS[CARD_FEATURES[3].id]}
              title={CARD_FEATURES[3].title}
              desc={CARD_FEATURES[3].desc}
              active={reveal}
              delay={1.12}
              parallaxX={pointerX}
              parallaxY={pointerY}
              depth={0.6}
            />
          </div>

          <div className="lg:hidden">
            <PayCard3D active={reveal} />

            <div className="mx-auto mt-8 max-w-md">
              <BalanceCard active={reveal} delay={0.8} parallaxX={pointerX} parallaxY={pointerY} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {CARD_FEATURES.map((feature, i) => (
                <FeatureCard
                  key={feature.id}
                  icon={FEATURE_ICONS[feature.id]}
                  title={feature.title}
                  desc={feature.desc}
                  active={reveal}
                  delay={0.9 + i * 0.08}
                  parallaxX={pointerX}
                  parallaxY={pointerY}
                  depth={0.4}
                />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={reveal ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.15 }}
        >
          <a
            href={CARD_APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="global-pay-btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-8 text-sm font-extrabold text-white"
          >
            {CARD_APPLY_LABEL}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#card-steps"
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white/90 px-7 text-sm font-bold text-[#0F172A] shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            How it works
          </a>
        </motion.div>

        <p className="mx-auto mt-6 max-w-lg text-center text-xs text-[#94A3B8]">
          *Card subject to KYC, issuer approval, and regional availability. Private keys never leave the
          secure element chip.
        </p>

        <CardOnboardingSteps />
      </div>
    </section>
  );
}
