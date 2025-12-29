"use client";

import { motion } from "framer-motion";
import { ChevronDown, Shield, TrendingUp, Globe, Building2, Eye, AlertCircle, Scale, CheckCircle } from "lucide-react";
import { useState } from "react";

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";

type FAQ = {
  question: string;
  answer: string;
  icon: any;
  details?: string[];
};

const faqs: FAQ[] = [
  {
    question: "What is Sagenex?",
    answer: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth across multiple sectors.",
    icon: Globe,
  },
  {
    question: "Is my money guaranteed or fixed?",
    answer: "No. Sagenex does not offer fixed or guaranteed returns. All earnings are performance-based and depend on participation, leadership, and business conditions.",
    icon: AlertCircle,
  },
  {
    question: "How is risk controlled?",
    answer: "Through a comprehensive multi-layered approach designed for long-term stability:",
    icon: Shield,
    details: [
      "Earnings caps (2.5X / 3X / 4X)",
      "12-leg distributed structure",
      "Multi-sector & multi-geography diversification",
      "Governance & compliance reviews",
    ],
  },
  {
    question: "Where is capital deployed?",
    answer: "Across independent sectors including: Forex, real estate, gold mining, agriculture, blockchain infrastructure, trading systems, business networks, and growth platforms.",
    icon: TrendingUp,
  },
  {
    question: "What role does SG Stocks play?",
    answer: "SG Stocks acts as a business growth and credibility layer, enabling visibility, expansion, capital circulation, and hiring within the ecosystem.",
    icon: Building2,
  },
  {
    question: "What happens in slow market conditions?",
    answer: "The system is designed to slow down safely, not collapse. Caps, carryforward rules, and diversification protect stability.",
    icon: TrendingUp,
  },
  {
    question: "How does SGBN add safety?",
    answer: "SGBN creates real-world value through:",
    icon: CheckCircle,
    details: [
      "Business referrals",
      "Hiring (including 30% community hiring rule)",
      "Freelancer engagement",
      "Capital circulation",
    ],
  },
  {
    question: "Can rules change?",
    answer: "Yes — but only to protect sustainability. All changes are communicated transparently for long-term ecosystem health.",
    icon: Scale,
  },
  {
    question: "Why should I trust Sagenex long-term?",
    answer: "Because it is Capped, Structured, Diversified, Governed, and Transparent. Short-term systems fail. Structured systems endure.",
    icon: Eye,
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Split FAQs into two columns
  const midpoint = Math.ceil(faqs.length / 2);
  const leftColumnFaqs = faqs.slice(0, midpoint);
  const rightColumnFaqs = faqs.slice(midpoint);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black py-16 px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.02)_1px,transparent_2px)] bg-[length:60px_100%] opacity-20 pointer-events-none" />

      <div className="relative container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3">
              <span className="text-white">Investor & Leader </span>
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${GOLD}`}>
                FAQ
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
              Everything you need to know about Sagenex's ecosystem, structure, and long-term vision
            </p>
          </motion.div>
        </div>

        {/* FAQ Accordion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left Column */}
          <div className="space-y-3">
            {leftColumnFaqs.map((faq, index) => {
              const Icon = faq.icon;
              const isOpen = openIndex === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div
                    className={`group relative rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? "border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-gray-950/40 to-gray-900/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        : "border-white/5 bg-gradient-to-br from-gray-900/50 to-gray-950/50 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full text-left p-4 flex items-start gap-3"
                    >
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                          isOpen
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1">
                        <h3
                          className={`text-base md:text-lg font-semibold transition-colors duration-300 ${
                            isOpen ? "text-white" : "text-gray-200 group-hover:text-white"
                          }`}
                        >
                          {faq.question}
                        </h3>
                      </div>

                      <div
                        className={`flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-emerald-400" : "text-gray-400"
                        }`}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-4 pb-4 pl-[60px]">
                        <p className="text-gray-300 text-sm leading-relaxed mb-2">{faq.answer}</p>
                        {faq.details && (
                          <ul className="space-y-1.5 mt-3">
                            {faq.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                                <span className="text-gray-300 text-sm">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {rightColumnFaqs.map((faq, index) => {
              const actualIndex = midpoint + index;
              const Icon = faq.icon;
              const isOpen = openIndex === actualIndex;

              return (
                <motion.div
                  key={actualIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: actualIndex * 0.05 }}
                >
                  <div
                    className={`group relative rounded-2xl border transition-all duration-300 ${
                      isOpen
                        ? "border-emerald-400/30 bg-gradient-to-br from-emerald-950/40 via-gray-950/40 to-gray-900/40 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        : "border-white/5 bg-gradient-to-br from-gray-900/50 to-gray-950/50 hover:border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(actualIndex)}
                      className="w-full text-left p-4 flex items-start gap-3"
                    >
                      <div
                        className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                          isOpen
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-gray-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1">
                        <h3
                          className={`text-base md:text-lg font-semibold transition-colors duration-300 ${
                            isOpen ? "text-white" : "text-gray-200 group-hover:text-white"
                          }`}
                        >
                          {faq.question}
                        </h3>
                      </div>

                      <div
                        className={`flex-shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-emerald-400" : "text-gray-400"
                        }`}
                      >
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </button>

                    {/* Answer */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-4 pb-4 pl-[60px]">
                        <p className="text-gray-300 text-sm leading-relaxed mb-2">{faq.answer}</p>
                        {faq.details && (
                          <ul className="space-y-1.5 mt-3">
                            {faq.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                                <span className="text-gray-300 text-sm">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div className="relative rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/30 via-gray-950/30 to-gray-900/30 p-6 md:p-8 backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative">
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-1">
                Sagenex is not built for speed.
              </p>
              <p className="text-xl md:text-2xl font-bold mb-2">
                <span className="text-white">It is built for </span>
                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${GOLD}`}>
                  survival, stability, and scale.
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
