"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const PLATFORMS = [
  {
    num: "01",
    name: "SG Trading",
    tag: "Crypto Trading",
    tagColor: "var(--crimson)",
    url: "https://sg5trader.sgxmeta.ai",
    desc: "Professional-grade cryptocurrency and digital asset trading platform with advanced tooling.",
    image: "/sg5trader.png",
  },
  {
    num: "02",
    name: "SGChain",
    tag: "Blockchain",
    tagColor: "var(--emerald)",
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
    image: "/sggold.png",
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
    tagColor: "var(--emerald)",
    url: "https://sgse.sgxmeta.ai",
    desc: "Securities exchange platform for tokenised assets and innovative investment opportunities.",
    image: "/sgse1.png",
  },
];

export default function EcosystemSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [previews, setPreviews] = useState<Array<{ id: number; name: string; image: string; x: number; y: number }>>([]);
  const previewIdRef = useRef(0);
  const previewTimersRef = useRef<number[]>([]);
  const lastSpawnRef = useRef<{ name: string | null; x: number }>({ name: null, x: 0 });
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const headingY = useTransform(scrollYProgress, [0, 1], [70, -90]);
  const bgWordX = useTransform(scrollYProgress, [0, 1], [-120, 120]);

  const spawnPreview = (name: string, image: string, x: number, y: number) => {
    const id = ++previewIdRef.current;
    setPreviews((prev) => [...prev, { id, name, image, x, y }].slice(-12));

    const timerId = window.setTimeout(() => {
      setPreviews((prev) => prev.filter((preview) => preview.id !== id));
      previewTimersRef.current = previewTimersRef.current.filter((t) => t !== timerId);
    }, 180);

    previewTimersRef.current.push(timerId);
  };

  useEffect(() => {
    return () => {
      previewTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      previewTimersRef.current = [];
    };
  }, []);

  return (
    <section ref={sectionRef} id="ecosystem" className="w-full landing-section-light py-16 sm:py-20 md:py-28 relative overflow-hidden">
      {/* Background watermark — desktop only */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-8 z-0 hidden whitespace-nowrap font-display text-[clamp(120px,14vw,240px)] font-extrabold tracking-[-0.05em] text-black/[0.025] lg:block"
        style={{ x: prefersReducedMotion ? 0 : bgWordX }}
      >
        SAGENEX ECOSYSTEM SAGENEX ECOSYSTEM
      </motion.div>

      {/* Subtle gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(0,179,134,0.08) 0%, transparent 36%), radial-gradient(circle at 86% 82%, rgba(196,30,58,0.07) 0%, transparent 32%)",
        }}
      />

      {/* Desktop hover preview images */}
      <AnimatePresence mode="sync">
        {previews.map((preview) => (
          <motion.div
            key={preview.id}
            className="fixed pointer-events-none z-200 overflow-hidden rounded-xl shadow-2xl border border-[var(--landing-border-light)] hidden lg:block"
            style={{ left: preview.x + 28, top: preview.y - 150, width: 240, height: 160 }}
            initial={{ clipPath: "inset(100% 0 0% 0%)", opacity: 1 }}
            animate={{ clipPath: "inset(0% 0 0% 0%)", opacity: 1 }}
            exit={{ clipPath: "inset(100% 0 0% 0%)", opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={preview.image} alt={preview.name} fill className="object-cover" sizes="240px" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ y: prefersReducedMotion ? 0 : headingY }}
          >
            <p className="landing-eyebrow text-[var(--crimson)] mb-3">Our Platforms</p>
            <h2 className="landing-headline">
              One Ecosystem.<br />
              <span className="text-[var(--emerald)]">Infinite Possibilities.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="landing-subtitle lg:text-right lg:max-w-sm"
          >
            Innovative platforms designed to revolutionise blockchain, trading, and investment — all under one roof.
          </motion.p>
        </div>

        {/* Mobile: Card grid | Desktop: Interactive row list */}
        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="landing-card group flex flex-col overflow-hidden"
              >
                {/* Image thumbnail */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-[var(--landing-bg-light)]">
                  <Image src={p.image} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--landing-text-dark)]">{p.name}</h3>
                    <span
                      className="inline-flex mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${p.tagColor}12`, color: p.tagColor }}
                    >
                      {p.tag}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--landing-text-muted)] group-hover:text-[var(--crimson)] transition-colors shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Desktop rows */}
        <div className="hidden lg:block border-t border-[var(--landing-border-light)]">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={prefersReducedMotion ? undefined : { x: 6 }}
            >
              <Link
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="feature-row group relative overflow-hidden"
                onMouseEnter={(e) => {
                  lastSpawnRef.current = { name: p.name, x: e.clientX };
                  spawnPreview(p.name, p.image, e.clientX, e.clientY);
                }}
                onMouseMove={(e) => {
                  if (lastSpawnRef.current.name !== p.name) {
                    lastSpawnRef.current = { name: p.name, x: e.clientX };
                    spawnPreview(p.name, p.image, e.clientX, e.clientY);
                    return;
                  }
                  if (Math.abs(e.clientX - lastSpawnRef.current.x) >= 22) {
                    lastSpawnRef.current = { name: p.name, x: e.clientX };
                    spawnPreview(p.name, p.image, e.clientX, e.clientY);
                  }
                }}
                onMouseLeave={() => {
                  if (lastSpawnRef.current.name === p.name) lastSpawnRef.current = { name: null, x: 0 };
                }}
              >
                <span className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(90deg, ${p.tagColor}14 0%, transparent 65%)` }} />
                <span className="feature-num text-[var(--landing-text-muted)]">{p.num}</span>
                <span className="feature-title text-[var(--landing-text-dark)]">{p.name}</span>
                <span className="text-[var(--landing-text-muted)] hidden md:block max-w-sm pt-2 text-sm">{p.desc}</span>
                <span
                  className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full self-center"
                  style={{ background: `${p.tagColor}12`, color: p.tagColor }}
                >
                  {p.tag}
                </span>
                <span className="ml-auto text-[var(--landing-border-light)] group-hover:text-[var(--crimson)] transition-colors shrink-0 self-center">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
