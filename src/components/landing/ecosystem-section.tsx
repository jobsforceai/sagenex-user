"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
  const eyebrowX = useTransform(scrollYProgress, [0, 1], [-22, 24]);
  const copyY = useTransform(scrollYProgress, [0, 1], [40, -30]);
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
    <section ref={sectionRef} id="ecosystem" className="w-full section-light py-24 md:py-32 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-8 z-0 hidden whitespace-nowrap font-display text-[clamp(120px,14vw,240px)] font-extrabold tracking-[-0.05em] text-black/3 lg:block"
        style={{ x: prefersReducedMotion ? 0 : bgWordX }}
      >
        SAGENEX ECOSYSTEM SAGENEX ECOSYSTEM
      </motion.div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(0,179,134,0.08) 0%, transparent 36%), radial-gradient(circle at 86% 82%, rgba(196,30,58,0.07) 0%, transparent 32%)",
        }}
      />

      <AnimatePresence mode="sync">
        {previews.map((preview) => (
          <motion.div
            key={preview.id}
            className="fixed pointer-events-none z-200 overflow-hidden rounded-xl shadow-2xl border border-(--border-light)"
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

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ y: prefersReducedMotion ? 0 : headingY }}
          >
            <motion.p className="eyebrow mb-4 text-(--crimson)" style={{ x: prefersReducedMotion ? 0 : eyebrowX }}>
              Our Platforms
            </motion.p>
            <h2 className="display-headline text-(--text-primary-light)">
              One Ecosystem.<br />
              <span className="text-(--emerald)">Infinite Possibilities.</span>
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-(--text-muted-light) max-w-sm leading-relaxed lg:text-right"
            style={{ y: prefersReducedMotion ? 0 : copyY }}
          >
            Innovative platforms designed to revolutionise blockchain, trading, and investment — all under one roof.
          </motion.p>
        </div>

        <div className="border-t border-(--border-light)">
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
                <span className="feature-num">{p.num}</span>
                <span className="feature-title text-(--text-primary-light)">{p.name}</span>
                <span className="text-(--text-muted-light) hidden md:block max-w-sm pt-2 text-sm">{p.desc}</span>
                <span
                  className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full self-center"
                  style={{ background: `${p.tagColor}15`, color: p.tagColor }}
                >
                  {p.tag}
                </span>
                <span className="ml-auto text-(--border-light) group-hover:text-(--crimson) transition-colors shrink-0 self-center">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
