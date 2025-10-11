"use client";
import { motion, Variants } from "framer-motion";
import {
  FaGlobeAmericas,
  FaWallet,
  FaShieldAlt,
  FaCrown,
  FaChartLine,
} from "react-icons/fa";
import { RiExchangeDollarFill } from "react-icons/ri";
import React from "react";
import Image from "next/image";

const features = [
  {
    icon: <FaWallet className="h-8 w-8 text-[#d4b36a]" />,
    title: "Seamless Withdrawals",
    desc: (
      <>
        Direct access to your bonuses, ROI payouts, and incentives.{" "}
        <span className="text-[#d4b36a] font-semibold">
          Withdraw instantly in local currency.
        </span>
      </>
    ),
  },
  {
    icon: <RiExchangeDollarFill className="h-8 w-8 text-[#d4b36a]" />,
    title: "Flexible Limits",
    desc: (
      <>
        Package-based withdrawal limits – from daily commissions to leadership
        bonuses, everything accessible anytime.
      </>
    ),
  },
  {
    icon: <FaCrown className="h-8 w-8 text-[#d4b36a]" />,
    title: "Premium Benefits",
    desc: (
      <>
        World Elite branding. Cashback offers & reward programs (coming soon).
      </>
    ),
  },
  {
    icon: <FaGlobeAmericas className="h-8 w-8 text-[#d4b36a]" />,
    title: "Global Access",
    desc: (
      <>
        Use your SAGENEX Cash Card at ATMs worldwide. Shop online/offline where{" "}
        <span className="text-[#d4b36a] font-semibold">Mastercard/Visa</span> is
        accepted.
      </>
    ),
  },
  {
    icon: <FaShieldAlt className="h-8 w-8 text-[#d4b36a]" />,
    title: "Safe & Secure",
    desc: (
      <>
        Backed by international banking partners (Dubai & U.S.). Fully{" "}
        <span className="text-[#d4b36a] font-semibold">KYC/AML-compliant</span>{" "}
        for secure transactions.
      </>
    ),
  },
  {
    icon: <FaChartLine className="h-8 w-8 text-[#d4b36a]" />,
    title: "Detailed Reports",
    desc: (
      <>
        Transparent statements and downloadable transaction history. Track
        earnings, withdrawals, and bonuses with easy CSV/ PDF exports.
      </>
    ),
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 24 } },
};

export default function CashCardSection() {
  return (
    <section
      className="relative overflow-hidden"
      aria-labelledby="cashcard-heading"
    >
      {/* gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b0f0c] via-[#10734f] to-[#18231d]" />
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(800px 400px at 70% 20%, rgba(212,179,106,.3), transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <h2
            id="cashcard-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            <span className="text-[#d4b36a]">SAGENEX Cash Card</span> — Withdraw
            Your Earnings Anywhere
          </h2>
          <p className="mt-3 text-[#b6c8bf] max-w-2xl mx-auto">
            Experience true financial freedom with instant access, flexible
            limits, and global usability — powered by{" "}
            <span className="text-[#d4b36a] font-semibold">SGCOIN</span> and
            international partners.
          </p>
        </motion.div>

        {/* Image mock (replace with real one if available) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          viewport={{ once: true }}
          className="mt-10 flex justify-center"
        >
          <div className="relative">
            <Image
            width={412}
            height={412}
              src="/sagenex-card-mock.png"
              alt="SAGENEX Cash Card"
              className="w-[380px] sm:w-[560px] rounded-xl"
            />
            {/* <div className="absolute -bottom-8 right-0 text-[#f0d493] font-bold text-2xl rotate-6">
              +2% CASHBACK 💰
            </div> */}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0f1411]/70 p-6 text-left text-white shadow-lg backdrop-blur-sm transition hover:shadow-[0_0_30px_rgba(212,179,106,.2)]"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-[#f0d493]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#d8e8e0]">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <p className="mt-12 text-xs text-[#9aaea2] max-w-2xl mx-auto leading-relaxed">
          *SAGENEX Cash Card is an international withdrawal facility for member
          incentives. Not regulated by SEBI/RBI in India. Usage subject to KYC,
          AML, and international card rules.
        </p>
      </div>
    </section>
  );
}
