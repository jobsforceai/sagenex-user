"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Wallet,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120 } },
};

const faqs = [
  {
    q: "How do I reset my password or log back in?",
    a: "Use the same email you registered with and request a new OTP from the login screen. If you still cannot access your account, contact support with your User ID.",
  },
  {
    q: "Where can I see my wallet balance and history?",
    a: "Open the app and go to the Wallet tab. You’ll see your available balance, transfers, deposits, withdrawals, and other transaction details.",
  },
  {
    q: "How does the referral network work?",
    a: "You can share your referral code from the Profile section. When new members join using your code, they appear in your team tree and contribute to your rank and rewards.",
  },
  {
    q: "How long do payouts take to process?",
    a: "Payout requests are typically processed within 1–3 business days, depending on verification and payout method. You can track payout status inside the app.",
  },
];

const SupportPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("wallet");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const [responseMessage, setResponseMessage] = useState("");

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setStatus("pending");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, topic, message }),
      });

      if (response.ok) {
        setStatus("success");
        setResponseMessage("Thanks! Your message has been submitted.");
        // Clear form
        setFullName("");
        setEmail("");
        setTopic("wallet");
        setMessage("");
      } else {
        const errorData = await response.json();
        setStatus("error");
        setResponseMessage(
          errorData.message || "Something went wrong. Please try again."
        );
      }
    } catch {
      setStatus("error");
      setResponseMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col">
      <Navbar variant="minimal" />
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-600/10 blur-3xl" />
      </div>

      <main className="flex-1 pt-24">
        <section className="border-b border-emerald-500/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-16 lg:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="max-w-xl space-y-4"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                We’re here to help
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl lg:text-5xl">
                Get support for your{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                  wallet & network
                </span>
                .
              </h1>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                Having trouble with your Sagenex wallet, payouts, ranking, or
                referral tree? Reach out and our team will help you get back on
                track as fast as possible.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80"
                >
                  Submit a support request
                </a>
                <a
                  href="#faq"
                  className="inline-flex items-center justify-center rounded-full border border-slate-600/80 bg-black/40 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-500/70 hover:text-emerald-300"
                >
                  View common questions
                </a>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Account & KYC help</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                  <span>Wallet & payout support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>Referral tree & ranks</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Quick contact cards */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid w-full max-w-md gap-4"
            >
              <motion.div
                variants={item}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-emerald-900/30 p-4 shadow-xl"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/90 text-black shadow-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-50">
                      Email Support
                    </h3>
                    <p className="text-xs text-slate-300">
                      Get 1:1 help from our team for account, wallet, or payout
                      issues.
                    </p>
                    <p className="text-xs font-mono text-emerald-300">
                      support@sagenex.ai
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={item}
                className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-slate-950/80 p-4"
              >
                <div className="absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-emerald-300">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-50">
                      Community & Updates
                    </h3>
                    <p className="text-xs text-slate-300">
                      Join our community channel for announcements, tips, and
                      status updates.
                    </p>
                    <p className="text-xs font-mono text-emerald-300">
                      t.me/sagenex
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Support categories + FAQ + Form */}
        <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:px-6 lg:py-14">
          {/* Left column: categories + FAQ */}
          <div className="w-full space-y-8 lg:w-1/2">
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <motion.div
                variants={item}
                className="group rounded-2xl border border-emerald-500/15 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/90 text-black">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50">
                    Wallet & Payouts
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Issues with balance, transfers, deposits, or withdrawals.
                  We’ll help verify and resolve them.
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className="group rounded-2xl border border-emerald-500/15 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50">
                    Referral Network
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Missing members, rank doubts, or tree structure questions?
                  Share your User ID and screenshot.
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className="group rounded-2xl border border-emerald-500/15 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50">
                    Account & KYC
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Help with login, OTP, KYC verification, or profile updates.
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className="group rounded-2xl border border-emerald-500/15 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900/80"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-50">
                    General Questions
                  </h3>
                </div>
                <p className="text-xs text-slate-300">
                  Anything else related to the Sagenex app or your membership.
                </p>
              </motion.div>
            </motion.div>

            {/* FAQ */}
            <div id="faq" className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Frequently Asked Questions
              </h2>
              <div className="divide-y divide-emerald-500/10 rounded-2xl border border-emerald-500/20 bg-slate-950/60">
                {faqs.map((faq, idx) => {
                  const isOpen = openIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        setOpenIndex(isOpen ? null : idx)
                      }
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <p className="text-sm font-medium text-slate-100">
                          {faq.q}
                        </p>
                        <span className="mt-1 text-xs text-emerald-300">
                          {isOpen ? "−" : "+"}
                        </span>
                      </div>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 pb-3 text-xs text-slate-300"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: contact form */}
          <motion.div
            id="contact"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: "spring", stiffness: 90 }}
            className="w-full lg:w-1/2"
          >
            <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(15,118,110,0.4)] sm:p-6">
              <h2 className="text-lg font-semibold text-slate-50">
                Submit a support request
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Share a few details and we’ll get back to you by email. For
                quicker resolution, include your User ID and screenshots if
                possible.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-4 text-xs"
              >
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-200">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-200">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-200">
                    Topic
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/60"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  >
                    <option value="wallet">Wallet / Balance / Payouts</option>
                    <option value="referral">
                      Referral Network / Rank & Tree
                    </option>
                    <option value="account">Login / OTP / Account / KYC</option>
                    <option value="courses">Courses & Packages</option>
                    <option value="other">Other Question</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-slate-200">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-1"
                    placeholder="Describe the issue you’re facing. Include your User ID and any relevant details."
                  />
                </div>

                {responseMessage && (
                  <div
                    className={`rounded-lg p-3 text-xs ${
                      status === "success"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-red-500/10 text-red-300"
                    }`}
                  >
                    {responseMessage}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <p className="max-w-xs text-[10px] text-slate-400">
                    By submitting, you agree to be contacted by the Sagenex
                    support team regarding this request.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    type="submit"
                    disabled={status === "pending"}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.7)] transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/80 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "pending" ? "Sending..." : "Send message"}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-emerald-500/10 bg-black/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-[11px] text-slate-400 sm:flex-row lg:px-6">
          <p>© {new Date().getFullYear()} Sagenex. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/privacy"
              className="hover:text-emerald-300 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="hover:text-emerald-300 transition-colors"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SupportPage;
