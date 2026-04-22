"use client";

import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

const FAQS = [
  { q: "What is Sagenex?", a: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth across multiple sectors." },
  { q: "Is my money guaranteed or fixed?", a: "No. Sagenex does not offer fixed or guaranteed returns. All earnings are performance-based and depend on participation, leadership, and business conditions." },
  { q: "How is risk controlled?", a: "Through a multi-layered approach designed for long-term stability — earnings caps (2.5X / 3X / 4X), a 12-leg distributed structure, multi-sector & multi-geography diversification, and ongoing governance & compliance reviews." },
  { q: "Where is capital deployed?", a: "Across Forex, real estate, gold mining, agriculture, blockchain infrastructure, trading systems, business networks, and growth platforms." },
  { q: "What happens in slow market conditions?", a: "The system is designed to slow down safely, not collapse. Caps, carryforward rules, and diversification protect stability in adverse conditions." },
  { q: "Why should I trust Sagenex long-term?", a: "Because it is Capped, Structured, Diversified, Governed, and Transparent. Short-term systems fail. Structured systems endure." },
];

function FAQRow({ faq, index, open, onToggle }: { faq: { q: string; a: string }; index: number; open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="faq-row"
      whileHover={{ x: 4 }}
    >
      <button
        className="faq-question py-2 text-(--text-primary-light) hover:text-(--crimson) transition-colors"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex items-center gap-6">
          <span className="text-[11px] font-bold tracking-widest text-(--emerald) shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-display font-bold text-xl md:text-2xl">{faq.q}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-xl text-(--text-muted-light)"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ans"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pl-11 pr-8 pt-4 pb-2 text-(--text-muted-light) leading-relaxed text-lg">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(open === i ? null : i);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const headingY = useTransform(scrollYProgress, [0, 1], [44, -24]);

  return (
    <section ref={sectionRef} className="section-light w-full py-24 md:py-32 border-t border-(--border-light) relative overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 h-[3px] origin-left bg-linear-to-r from-(--emerald) via-(--crimson) to-(--emerald)"
        style={{ scaleX: prefersReducedMotion ? 1 : scrollYProgress }}
      />

      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
          style={{ y: prefersReducedMotion ? 0 : headingY }}
        >
          <p className="eyebrow mb-4">FAQ</p>
          <h2 className="display-headline text-(--text-primary-light)">
            Questions,<br />
            <span className="text-(--emerald)">answered.</span>
          </h2>
        </motion.div>

        <div className="border-t border-(--border-light)">
          {FAQS.map((faq, i) => (
            <FAQRow key={i} faq={faq} index={i} open={open === i} onToggle={() => toggle(i)} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-20 flex flex-col items-center justify-center p-8 glass-card border-(--border-light) bg-white/50 text-center"
        >
          <h3 className="font-display font-extrabold text-2xl md:text-3xl text-(--text-primary-light) mb-2">
            Sagenex is not built for speed.
          </h3>
          <p className="text-(--emerald) font-bold text-xl md:text-2xl">
            Built for survival, stability, and scale.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
