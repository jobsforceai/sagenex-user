"use client";
import { motion, Variants } from "framer-motion";
import { FaAndroid, FaApple, FaMobileAlt, FaRocket, FaShieldAlt } from "react-icons/fa";
import React from "react";
import Image from "next/image";
import HeroButton from "../ui/hero-button";

const features = [
  {
    icon: <FaMobileAlt className="h-8 w-8 text-[#d4b36a]" />,
    title: "Full Dashboard Access",
    desc: "Manage your portfolio, track earnings, and view your team's progress on the go.",
  },
  {
    icon: <FaShieldAlt className="h-8 w-8 text-[#d4b36a]" />,
    title: "Secure Wallet Management",
    desc: "Deposit, withdraw, and transfer funds with the same level of security as the web platform.",
  },
  {
    icon: <FaRocket className="h-8 w-8 text-[#d4b36a]" />,
    title: "Real-time Notifications",
    desc: "Get instant alerts for new sign-ups, payouts, and important announcements.",
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 24 } },
};

export default function AppDownloadSection() {
    const apkUrl = "https://sagenex-academy-videos.s3.ap-south-1.amazonaws.com/androidapp/application-31eaf486-48ca-4b74-b0e6-9c7fdecd98a3.apk";

  return (
    <section
      id="android-app"
      className="relative overflow-hidden bg-[#0a0a0a]"
      aria-labelledby="appdownload-heading"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b0f0c] via-[#103c73] to-[#111823]" />
        <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          background:
            "radial-gradient(1000px 600px at 20% 30%, rgba(106, 179, 212, 0.3), transparent 70%)",
        }}
        />


      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24 grid lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left Side: Image */}
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex justify-center"
        >
          <div className="relative w-[280px] h-[560px] sm:w-[300px] sm:h-[600px]">
            <Image
              src="/mobdash.JPG"
              alt="SAGENEX App on Mobile"
              fill
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Right Side: Content */}
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{delay: 0.2}}
            viewport={{ once: true, margin: "-80px" }}
            className="text-white mt-12 lg:mt-0"
        >
          <h2
            id="appdownload-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          >
            <span className="text-[#d4b36a]">Access Sagenex On The Go</span>
          </h2>
          <p className="mt-4 text-[#b6c8bf] max-w-2xl text-lg">
            Download our official Android application to stay connected with the Sagenex ecosystem anytime, anywhere.
          </p>

            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="mt-8 grid gap-4 sm:grid-cols-1"
            >
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0f1411]/70 p-4 backdrop-blur-sm"
                >
                  <div className="flex-shrink-0">{f.icon}</div>
                  <div>
                    <h3 className="text-base font-bold text-[#f0d493]">{f.title}</h3>
                    <p className="mt-1 text-sm text-[#d8e8e0]">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

           <div className="mt-8 flex flex-col sm:flex-row gap-4">
             <HeroButton href={apkUrl}>
                <FaAndroid className="mr-2 h-5 w-5" />
                Download for Android
             </HeroButton>
             <HeroButton intent="secondary" href="#" disabled>
                <FaApple className="mr-2 h-5 w-5" />
                iOS Coming Soon
             </HeroButton>
           </div>
           <p className="mt-4 text-xs text-[#9aaea2]">
            *Requires Android 8.0 or later.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
