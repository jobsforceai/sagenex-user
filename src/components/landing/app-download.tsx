"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Smartphone, ShieldCheck, BarChart3 } from "lucide-react";
import { FaAndroid, FaApple } from "react-icons/fa";

const FEATURES = [
  { icon: Smartphone, label: "Full Dashboard Access", desc: "Manage your portfolio, track earnings, and view team progress on the go." },
  { icon: ShieldCheck, label: "Secure Wallet Management", desc: "Deposit, withdraw, and transfer funds with the same security as the web platform." },
  { icon: BarChart3, label: "Growth Insights", desc: "Track earnings, team momentum, and reward progress from one mobile dashboard." },
];

export default function AppDownloadSection() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || "https://example.com/sagenex.apk";
  const iosUrl = "https://apps.apple.com/us/app/sagenex/id6755692818";
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [50, -40]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [-6, 4]);

  return (
    <section ref={sectionRef} id="app" className="w-full landing-section-light py-16 sm:py-20 md:py-28 overflow-hidden border-t border-[var(--landing-border-light)] relative">
      {/* Subtle orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[7%] top-[14%] h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(0,179,134,0.1)_0%,transparent_70%)]" />
        <div className="absolute right-[9%] top-[58%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(196,30,58,0.07)_0%,transparent_74%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-16">

          {/* Phone mockup — centered above on mobile, left side on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0 flex justify-center"
            style={{ y: prefersReducedMotion ? 0 : phoneY }}
          >
            <motion.div
              className="relative rounded-[2.5rem] p-2.5 sm:p-3 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)] border border-[var(--landing-border-light)]"
              style={{ rotate: prefersReducedMotion ? -2 : phoneRotate }}
              whileHover={prefersReducedMotion ? undefined : { rotate: 0, y: -6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative rounded-[2rem] overflow-hidden" style={{ width: 230, height: 480 }}>
                <Image src="/mobdash.JPG" alt="Sagenex Mobile App" fill className="object-cover" />
              </div>
            </motion.div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex-1 max-w-xl text-center lg:text-left"
          >
            <p className="landing-eyebrow text-[var(--crimson)] mb-3">Mobile App</p>
            <h2 className="landing-headline mb-5">
              Sagenex,<br />
              <span className="text-[var(--emerald)]">in your pocket.</span>
            </h2>
            <p className="landing-subtitle mx-auto lg:mx-0 mb-10">
              Stay connected to the Sagenex wealth ecosystem anytime, anywhere. Full control, institutional security, right at your fingertips.
            </p>

            <div className="space-y-5 mb-10">
              {FEATURES.map(({ icon: Icon, label, desc }, idx) => (
                <motion.div
                  key={label}
                  className="flex items-start gap-4 text-left"
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + idx * 0.07 }}
                >
                  <div className="shrink-0 h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--emerald)]" />
                  </div>
                  <div>
                    <h4 className="font-bold font-display text-base text-[var(--landing-text-dark)] mb-0.5">{label}</h4>
                    <p className="text-[var(--landing-text-muted)] text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Download buttons — full-width stacked on mobile */}
            <motion.div
              className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center lg:justify-start"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href={apkUrl} target="_blank" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--emerald)] px-7 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(0,179,134,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#009b74] active:scale-[0.98]">
                  <FaAndroid size={18} /> Android APK
                </button>
              </Link>
              <Link href={iosUrl} target="_blank" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--landing-border-light)] bg-white px-7 text-sm font-extrabold text-[var(--landing-text-dark)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 active:scale-[0.98]">
                  <FaApple size={18} /> App Store
                </button>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
