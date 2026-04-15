"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const FAQS = [
  { q: "What is Sagenex?", a: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth across multiple sectors." },
  { q: "Is my money guaranteed or fixed?", a: "No. Sagenex does not offer fixed or guaranteed returns. All earnings are performance-based and depend on participation, leadership, and business conditions." },
  { q: "How is risk controlled?", a: "Through a multi-layered approach designed for long-term stability — earnings caps (2.5X / 3X / 4X), a 12-leg distributed structure, multi-sector & multi-geography diversification, and ongoing governance & compliance reviews." },
  { q: "Where is capital deployed?", a: "Across Forex, real estate, gold mining, agriculture, blockchain infrastructure, trading systems, business networks, and growth platforms." },
  { q: "What role does SG Stocks play?", a: "SG Stocks acts as a business growth and credibility layer — enabling visibility, expansion, capital circulation, and hiring within the ecosystem." },
  { q: "What happens in slow market conditions?", a: "The system is designed to slow down safely, not collapse. Caps, carryforward rules, and diversification protect stability in adverse conditions." },
  { q: "How does SGBN add safety?", a: "SGBN creates real-world value through business referrals, structured hiring (including a 30% community hiring rule), freelancer engagement, and capital circulation within the network." },
  { q: "Can rules change?", a: "Yes — but only to protect sustainability. All changes are communicated transparently and made for long-term ecosystem health." },
  { q: "Why should I trust Sagenex long-term?", a: "Because it is Capped, Structured, Diversified, Governed, and Transparent. Short-term systems fail. Structured systems endure." },
];

function FAQRow({ faq, index, open, onToggle }: { faq: { q: string; a: string }; index: number; open: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.38, delay: index * 0.04 }}
      className="faq-row"
    >
      <button
        className="faq-question w-full text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex items-center gap-4">
          <span
            className="text-[11px] font-semibold tabular-nums shrink-0"
            style={{ color: "#bbb", letterSpacing: "0.06em" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{faq.q}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22 }}
          className="shrink-0 text-[#ccc] block"
          style={{ fontSize: 22, lineHeight: 1 }}
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
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="faq-answer pl-8">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <section className="w-full bg-[#fafafa] py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="eyebrow mb-4">FAQ</p>
          <h2
            className="font-extrabold text-[#0a0a0a] leading-[0.95]"
            style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.03em" }}
          >
            Questions,<br />
            <span className="text-[#00b386]">answered.</span>
          </h2>
        </motion.div>

        {/* Accordion */}
        <div>
          {FAQS.map((faq, i) => (
            <FAQRow
              key={i}
              faq={faq}
              index={i}
              open={open === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-16 border-l-4 border-[#00b386] pl-6"
        >
          <p
            className="font-bold text-[#0a0a0a] leading-tight"
            style={{ fontSize: "clamp(20px, 2.5vw, 30px)", letterSpacing: "-0.02em" }}
          >
            Sagenex is not built for speed.
          </p>
          <p
            className="font-bold text-[#00b386] leading-tight"
            style={{ fontSize: "clamp(20px, 2.5vw, 30px)", letterSpacing: "-0.02em" }}
          >
            Built for survival, stability, and scale.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
