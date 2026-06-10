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
      className={`border-b border-[var(--landing-border-light)] transition-colors ${open ? "border-l-2 border-l-[var(--crimson)]" : "border-l-2 border-l-transparent"}`}
    >
      <button
        className="flex w-full items-center justify-between gap-4 py-5 px-2 sm:px-4 text-left text-[var(--landing-text-dark)] hover:text-[var(--crimson)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--emerald)]/30 rounded-lg"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex items-center gap-4 sm:gap-6">
          <span className="text-[11px] font-bold tracking-widest text-[var(--emerald)] shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-display font-bold text-base sm:text-lg md:text-xl">{faq.q}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-xl text-[var(--landing-text-muted)] h-8 w-8 flex items-center justify-center"
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
            <p className="pl-10 sm:pl-14 pr-4 sm:pr-8 pt-1 pb-5 text-[var(--landing-text-muted)] leading-relaxed text-sm sm:text-base">
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
  const headingY = useTransform(scrollYProgress, [0, 1], [30, -16]);

  return (
    <section ref={sectionRef} className="landing-section-light w-full py-16 sm:py-20 md:py-28 border-t border-[var(--landing-border-light)] relative overflow-hidden">
      {/* Progress bar */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-0 h-[3px] origin-left bg-gradient-to-r from-[var(--emerald)] via-[var(--crimson)] to-[var(--emerald)]"
        style={{ scaleX: prefersReducedMotion ? 1 : scrollYProgress }}
      />

      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 sm:mb-14 text-center"
          style={{ y: prefersReducedMotion ? 0 : headingY }}
        >
          <p className="landing-eyebrow mb-3">FAQ</p>
          <h2 className="landing-headline">
            Questions,<br />
            <span className="text-[var(--emerald)]">answered.</span>
          </h2>
        </motion.div>

        <div className="border-t border-[var(--landing-border-light)]">
          {FAQS.map((faq, i) => (
            <FAQRow key={i} faq={faq} index={i} open={open === i} onToggle={() => toggle(i)} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 sm:mt-16 flex flex-col items-center justify-center p-6 sm:p-8 landing-card bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 text-center"
        >
          <h3 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-[var(--landing-text-dark)] mb-2">
            Sagenex is not built for speed.
          </h3>
          <p className="text-[var(--emerald)] font-bold text-lg sm:text-xl md:text-2xl">
            Built for survival, stability, and scale.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
