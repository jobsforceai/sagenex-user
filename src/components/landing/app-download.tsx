"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Smartphone, ShieldCheck, Bell } from "lucide-react";
import { FaAndroid, FaApple } from "react-icons/fa";

const features = [
  { icon: Smartphone, title: "Full Dashboard Access", desc: "Manage your portfolio, track earnings, and view team progress on the go." },
  { icon: ShieldCheck, title: "Secure Wallet Management", desc: "Deposit, withdraw, and transfer funds with the same security as the web platform." },
  { icon: Bell, title: "Real-time Notifications", desc: "Instant alerts for new sign-ups, payouts, and important announcements." },
];

export default function AppDownloadSection() {
  const apkUrl = process.env.NEXT_PUBLIC_ANDROID_APK_URL || "https://example.com/sagenex.apk";
  const iosUrl = "https://apps.apple.com/us/app/sagenex/id6755692818";

  return (
    <section id="android-app" className="w-full bg-[#f7f8fa] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="flex justify-center"
          >
            <div className="relative w-[260px] h-[530px] sm:w-[300px] sm:h-[610px]">
              <Image src="/mobdash.JPG" alt="Sagenex App" fill className="object-contain drop-shadow-2xl" />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              Mobile App
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-4 leading-tight">
              Access Sagenex{" "}
              <span className="text-[#00b386]">On The Go</span>
            </h2>
            <p className="text-[#555] text-lg mb-8">
              Download our official app to stay connected with the Sagenex ecosystem anytime, anywhere.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-white border border-[#e8e8e8] rounded-xl p-4 shadow-sm">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#e6f7f3] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[#00b386]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1a1a1a] text-sm mb-0.5">{title}</h3>
                    <p className="text-sm text-[#555]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={apkUrl} target="_blank">
                <button className="btn-groww gap-2">
                  <FaAndroid className="h-5 w-5" /> Download for Android
                </button>
              </Link>
              <Link href={iosUrl} target="_blank">
                <button className="btn-groww-outline gap-2">
                  <FaApple className="h-5 w-5" /> Download for iOS
                </button>
              </Link>
            </div>
            <p className="mt-3 text-xs text-[#888]">*Requires Android 8.0 or later.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
