"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Smartphone, ShieldCheck, Bell } from "lucide-react";
import { FaAndroid, FaApple } from "react-icons/fa";

const FEATURES = [
  { icon: Smartphone, label: "Full Dashboard Access", desc: "Manage your portfolio, track earnings, and view team progress on the go." },
  { icon: ShieldCheck, label: "Secure Wallet Management", desc: "Deposit, withdraw, and transfer funds with the same security as the web platform." },
  { icon: Bell, label: "Real-time Notifications", desc: "Instant alerts for new sign-ups, payouts, and important announcements." },
];

export default function AppDownloadSection() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || "https://example.com/sagenex.apk";
  const iosUrl = "https://apps.apple.com/us/app/sagenex/id6755692818";
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [70, -60]);
  const phoneRotate = useTransform(scrollYProgress, [0, 1], [-8, 6]);
  const copyY = useTransform(scrollYProgress, [0, 1], [40, -20]);
  const orbOneY = useTransform(scrollYProgress, [0, 1], [-12, 18]);
  const orbTwoY = useTransform(scrollYProgress, [0, 1], [18, -22]);

  return (
    <section ref={sectionRef} id="app" className="w-full section-light py-24 md:py-32 overflow-hidden border-t border-(--border-light) relative">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[7%] top-[14%] h-28 w-28 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0,179,134,0.18) 0%, rgba(0,179,134,0) 70%)",
            y: prefersReducedMotion ? 0 : orbOneY,
          }}
        />
        <motion.div
          className="absolute right-[9%] top-[58%] h-40 w-40 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0) 74%)",
            y: prefersReducedMotion ? 0 : orbTwoY,
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex justify-center lg:justify-start"
            style={{ y: prefersReducedMotion ? 0 : phoneY }}
          >
            <motion.div
              className="relative rounded-[2.5rem] p-3 bg-white shadow-2xl border border-(--border-light)"
              style={{ rotate: prefersReducedMotion ? -2 : phoneRotate }}
              whileHover={prefersReducedMotion ? undefined : { rotate: 0, y: -8 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative rounded-4xl overflow-hidden" style={{ width: 280, height: 580 }}>
                <Image src="/mobdash.JPG" alt="Sagenex Mobile App" fill className="object-cover" />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex-1 max-w-xl"
            style={{ y: prefersReducedMotion ? 0 : copyY }}
          >
            <p className="eyebrow mb-4 text-(--crimson)">Mobile App</p>
            <h2 className="display-headline text-(--text-primary-light) mb-6 leading-[0.9]">
              Sagenex,<br />
              <span className="text-(--emerald)">in your pocket.</span>
            </h2>
            <p className="text-(--text-muted-light) text-lg mb-12">
              Stay connected to the Sagenex wealth ecosystem anytime, anywhere. Full control, institutional security, right at your fingertips.
            </p>

            <div className="space-y-8 mb-12">
              {FEATURES.map(({ icon: Icon, label, desc }, idx) => (
                <motion.div
                  key={label}
                  className="flex items-start gap-5"
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.12 + idx * 0.08 }}
                >
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-(--emerald-glow) border border-(--emerald)/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-(--emerald)" />
                  </div>
                  <div>
                    <h4 className="font-bold font-display text-lg text-(--text-primary-light) mb-1">{label}</h4>
                    <p className="text-(--text-muted-light) leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Link href={apkUrl} target="_blank">
                <button className="btn-primary gap-2 bg-(--emerald) hover:bg-[#009b74] shadow-[0_4px_20px_var(--emerald-glow)]">
                  <FaAndroid size={18} /> Android APK
                </button>
              </Link>
              <Link href={iosUrl} target="_blank">
                <button className="btn-secondary text-(--text-primary-light) border-(--border-light) hover:bg-(--paper)">
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
