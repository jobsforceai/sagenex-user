"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useState } from "react";

const PLATFORMS = [
  {
    num: "01",
    name: "SG Trading",
    tag: "Crypto Trading",
    tagColor: "#f97316",
    url: "https://sg5trader.sgxmeta.ai",
    desc: "Professional-grade cryptocurrency and digital asset trading platform with advanced tooling.",
    image: "/sg5trader.png",
  },
  {
    num: "02",
    name: "SGChain",
    tag: "Blockchain",
    tagColor: "#6366f1",
    url: "https://sgchain.sgxmeta.ai",
    desc: "Decentralised blockchain infrastructure built for speed, security, and global scalability.",
    image: "/sgchain.png",
  },
  {
    num: "03",
    name: "SGGOLD",
    tag: "Gold Rewards",
    tagColor: "#d97706",
    url: "https://sggold.sgxmeta.ai/",
    desc: "Loyalty rewards ecosystem powered by SG Gold — eligibility codes and exclusive gold incentives.",
    image: "/globe-3d-gold.png",
  },
  {
    num: "04",
    name: "SGBN",
    tag: "Business Network",
    tagColor: "#0ea5e9",
    url: "https://sgbn.sgxmeta.ai",
    desc: "Business network connecting entrepreneurs and investors for collaborative, structured growth.",
    image: "/sgbn.png",
  },
  {
    num: "05",
    name: "SGSE",
    tag: "Securities",
    tagColor: "#00b386",
    url: "https://sgse.sgxmeta.ai",
    desc: "Securities exchange platform for tokenised assets and innovative investment opportunities.",
    image: "/sgse1.png",
  },
];

const VERTICALS = [
  { icon: "💱", name: "Forex Trading", desc: "Professionally managed strategies with risk-controlled deployment." },
  { icon: "🏢", name: "International Real Estate", desc: "Strategic exposure to overseas markets focusing on asset appreciation." },
  { icon: "⛏️", name: "Gold Mining", desc: "Physical asset-backed industries in Africa as an inflation hedge." },
  { icon: "🌾", name: "Agriculture Yields", desc: "Non-correlated participation in food security and export models." },
  { icon: "✈️", name: "SG Travels Club", desc: "Lifestyle and community utility vertical.", comingSoon: true },
];

export default function EcosystemSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  // Track raw mouse position in viewport coords
  const rawX = useMotionValue(-300);
  const rawY = useMotionValue(-300);

  // Spring-smooth the position (the "lag" feel)
  const x = useSpring(rawX, { stiffness: 280, damping: 28, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 280, damping: 28, mass: 0.4 });

  // Offset: image appears to the right of and above the cursor
  const imgX = useTransform(x, (v) => v + 28);
  const imgY = useTransform(y, (v) => v - 150);

  const hoveredPlatform = PLATFORMS.find((p) => p.name === hovered);

  return (
    <section
      id="ecosystem"
      className="w-full bg-[#fafafa] py-24 md:py-32"
      onMouseMove={(e) => {
        rawX.set(e.clientX);
        rawY.set(e.clientY);
      }}
    >
      {/* ── Floating image preview (fixed, follows cursor) ── */}
      <AnimatePresence mode="sync">
        {hovered && hoveredPlatform && (
          <motion.div
            key={hovered}
            className="fixed pointer-events-none z-200 overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
            style={{
              left: 0,
              top: 0,
              x: imgX,
              y: imgY,
              width: 240,
              height: 160,
            }}
            initial={{ clipPath: "inset(100% 0 0% 0%)", opacity: 1 }}
            animate={{ clipPath: "inset(0% 0 0% 0%)", opacity: 1 }}
            exit={{ clipPath: "inset(100% 0 0% 0%)", opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={hoveredPlatform.image}
              alt={hoveredPlatform.name}
              fill
              className="object-cover"
              sizes="240px"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow mb-4">Our Ecosystem</p>
            <h2
              className="font-extrabold text-[#0a0a0a] leading-[0.95]"
              style={{ fontSize: "clamp(40px, 5.5vw, 80px)", letterSpacing: "-0.03em" }}
            >
              One Platform.<br />
              <span className="text-[#00b386]">Multiple Verticals.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[16px] text-[#666] max-w-sm leading-relaxed lg:text-right"
          >
            Innovative platforms designed to revolutionise blockchain, trading, and investment — all under one roof.
          </motion.p>
        </div>

        {/* ── Platform rows ── */}
        <div className="mb-20">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              <Link
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="feature-row group block"
                onMouseEnter={() => setHovered(p.name)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="feature-row__num">{p.num}</span>
                <span className="feature-row__title">{p.name}</span>
                <span className="feature-row__desc hidden md:block">{p.desc}</span>
                <span
                  className="feature-row__tag hidden sm:inline-flex"
                  style={{ background: p.tagColor + "18", color: p.tagColor }}
                >
                  {p.tag}
                </span>
                <span className="ml-auto text-[#ccc] group-hover:text-[#00b386] transition-colors shrink-0">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Investment Verticals ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-8"
        >
          <p className="eyebrow mb-3">Investment Verticals</p>
          <h3
            className="font-bold text-[#0a0a0a]"
            style={{ fontSize: "clamp(24px, 3vw, 40px)", letterSpacing: "-0.02em" }}
          >
            Where capital is deployed.
          </h3>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VERTICALS.map((v, i) => (
            <motion.div
              key={v.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.07 }}
              className="bento-card p-6 flex items-start gap-4"
            >
              <span className="text-2xl shrink-0 mt-0.5">{v.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-bold text-[#0a0a0a] text-[15px] tracking-tight">{v.name}</h4>
                  {v.comingSoon && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full border border-blue-100">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#777] leading-relaxed">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
