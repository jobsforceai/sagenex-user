"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, TrendingUp, Globe, Building2, Eye, AlertCircle, Scale, CheckCircle } from "lucide-react";
import { useState } from "react";

type FAQ = { question: string; answer: string; icon: React.ElementType; details?: string[] };

const faqs: FAQ[] = [
  { question: "What is Sagenex?", answer: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth across multiple sectors.", icon: Globe },
  { question: "Is my money guaranteed or fixed?", answer: "No. Sagenex does not offer fixed or guaranteed returns. All earnings are performance-based and depend on participation, leadership, and business conditions.", icon: AlertCircle },
  { question: "How is risk controlled?", answer: "Through a multi-layered approach designed for long-term stability:", icon: Shield, details: ["Earnings caps (2.5X / 3X / 4X)", "12-leg distributed structure", "Multi-sector & multi-geography diversification", "Governance & compliance reviews"] },
  { question: "Where is capital deployed?", answer: "Across Forex, real estate, gold mining, agriculture, blockchain infrastructure, trading systems, business networks, and growth platforms.", icon: TrendingUp },
  { question: "What role does SG Stocks play?", answer: "SG Stocks acts as a business growth and credibility layer — enabling visibility, expansion, capital circulation, and hiring within the ecosystem.", icon: Building2 },
  { question: "What happens in slow market conditions?", answer: "The system is designed to slow down safely, not collapse. Caps, carryforward rules, and diversification protect stability.", icon: TrendingUp },
  { question: "How does SGBN add safety?", answer: "SGBN creates real-world value through:", icon: CheckCircle, details: ["Business referrals", "Hiring (including 30% community hiring rule)", "Freelancer engagement", "Capital circulation"] },
  { question: "Can rules change?", answer: "Yes — but only to protect sustainability. All changes are communicated transparently for long-term ecosystem health.", icon: Scale },
  { question: "Why should I trust Sagenex long-term?", answer: "Because it is Capped, Structured, Diversified, Governed, and Transparent. Short-term systems fail. Structured systems endure.", icon: Eye },
];

function FAQItem({ faq, index, openIndex, setOpenIndex }: { faq: FAQ; index: number; openIndex: number | null; setOpenIndex: (i: number | null) => void }) {
  const Icon = faq.icon;
  const isOpen = openIndex === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${isOpen ? "border-[#00b386]/40 shadow-[0_0_0_2px_rgba(0,179,134,0.08)]" : "border-[#e8e8e8]"} bg-white`}>
        <button
          onClick={() => setOpenIndex(isOpen ? null : index)}
          className="w-full text-left p-4 flex items-center gap-3"
        >
          <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${isOpen ? "bg-[#e6f7f3] text-[#00b386]" : "bg-[#f7f8fa] text-[#888]"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className={`flex-1 text-sm font-semibold leading-snug ${isOpen ? "text-[#1a1a1a]" : "text-[#333]"}`}>{faq.question}</span>
          <ChevronDown className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#00b386]" : "text-[#aaa]"}`} />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pl-14">
                <p className="text-sm text-[#555] leading-relaxed">{faq.answer}</p>
                {faq.details && (
                  <ul className="mt-3 space-y-1.5">
                    {faq.details.map((d, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#555]">
                        <CheckCircle className="h-4 w-4 text-[#00b386] flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const mid = Math.ceil(faqs.length / 2);

  return (
    <section className="w-full bg-[#f7f8fa] py-20 md:py-28 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Investor &amp; Leader FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-3">Frequently Asked Questions</h2>
          <p className="text-[#555] text-lg max-w-2xl mx-auto">Everything you need to know about Sagenex's ecosystem, structure, and long-term vision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          <div className="space-y-3">
            {faqs.slice(0, mid).map((f, i) => (
              <FAQItem key={i} faq={f} index={i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
            ))}
          </div>
          <div className="space-y-3">
            {faqs.slice(mid).map((f, i) => (
              <FAQItem key={mid + i} faq={f} index={mid + i} openIndex={openIndex} setOpenIndex={setOpenIndex} />
            ))}
          </div>
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center border border-[#00b386]/20 rounded-2xl bg-white p-6 md:p-8 shadow-sm"
        >
          <p className="text-xl md:text-2xl font-bold text-[#1a1a1a] mb-1">Sagenex is not built for speed.</p>
          <p className="text-xl md:text-2xl font-bold">
            It is built for{" "}
            <span className="text-[#00b386]">survival, stability, and scale.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
