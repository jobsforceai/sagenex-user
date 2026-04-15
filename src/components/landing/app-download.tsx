"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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

  return (
    <section id="android-app" className="w-full bg-white py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-center justify-between">

          {/* ── Phone mockup ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center flex-shrink-0"
          >
            <div
              className="relative rounded-4xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18)] border border-[#e8e8e8]"
              style={{ width: 240, height: 490 }}
            >
              <Image src="/mobdash.JPG" alt="Sagenex Mobile App" fill className="object-cover" />
            </div>
          </motion.div>

          {/* ── Content ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="flex-1 flex flex-col justify-center max-w-lg"
          >
            <p className="eyebrow mb-4">Mobile App</p>
            <h2
              className="font-extrabold text-[#0a0a0a] leading-[0.95] mb-6"
              style={{ fontSize: "clamp(36px, 4.5vw, 64px)", letterSpacing: "-0.03em" }}
            >
              Sagenex,<br />
              <span className="text-[#00b386]">on the go.</span>
            </h2>
            <p className="text-[16px] text-[#666] mb-10 leading-relaxed max-w-sm">
              Download our official app to stay connected with the Sagenex ecosystem anytime, anywhere.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-5 mb-10">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="shrink-0 h-9 w-9 rounded-xl bg-[#f0fdf9] border border-[#99f6e4] flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[#00b386]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a0a0a] text-[14px] mb-0.5">{label}</p>
                    <p className="text-[13px] text-[#777] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={apkUrl} target="_blank">
                <button className="btn-cta-primary gap-2">
                  <FaAndroid size={16} /> Download for Android
                </button>
              </Link>
              <Link href={iosUrl} target="_blank">
                <button className="btn-cta-secondary gap-2">
                  <FaApple size={16} /> Download for iOS
                </button>
              </Link>
            </div>
            <p className="mt-3 text-[11px] text-[#bbb]">* Requires Android 8.0 or later.</p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
