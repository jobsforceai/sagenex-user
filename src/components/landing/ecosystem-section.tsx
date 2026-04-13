"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const mainCards = [
  {
    name: "SG Trading",
    description: "Advanced trading platform for cryptocurrency and digital assets with professional-grade tools.",
    url: "https://sg5trader.sgxmeta.ai",
    image: "/sg5trader.png",
    tag: "Crypto Trading",
    tagColor: "#f97316",
  },
  {
    name: "SGChain",
    description: "Our revolutionary decentralized blockchain platform built for speed, security, and scalability.",
    url: "https://sgchain.sgxmeta.ai",
    image: "/sgchain.png",
    tag: "Blockchain",
    tagColor: "#6366f1",
  },
  {
    name: "SGGOLD",
    description: "Loyalty rewards powered by SG Gold — eligibility codes and exclusive gold incentives.",
    url: "https://sggold.sgxmeta.ai/",
    image: "/globe-3d-gold.png",
    tag: "Gold Rewards",
    tagColor: "#d97706",
  },
  {
    name: "SGBN",
    description: "Business network connecting entrepreneurs and investors for collaborative growth.",
    url: "https://sgbn.sgxmeta.ai",
    image: "/sgbn.png",
    tag: "Business Network",
    tagColor: "#0ea5e9",
  },
  {
    name: "SGSE",
    description: "Securities exchange platform for tokenized assets and innovative investment opportunities.",
    url: "https://sgse.sgxmeta.ai",
    image: "/sgse1.png",
    tag: "Securities",
    tagColor: "#00b386",
  },
];

const secondaryCards = [
  { name: "Forex Trading", desc: "Professionally managed strategies with risk-controlled deployment.", icon: "💱" },
  { name: "Int. Real Estate", desc: "Strategic exposure to overseas markets focusing on asset value appreciation.", icon: "🏢" },
  { name: "Gold Mining", desc: "Physical asset-backed industries in Africa as a hedge against inflation.", icon: "⛏️" },
  { name: "Agriculture Yields", desc: "Non-correlated participation in food security and export models.", icon: "🌾" },
  { name: "SG Travels Club", desc: "Utility vertical designed for lifestyle and community benefits.", icon: "✈️", comingSoon: true },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 180, damping: 22 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function EcosystemSection() {
  return (
    <section id="ecosystem" className="w-full bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Our Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a1a1a] mb-4">
              One Platform. Multiple{" "}
              <span className="text-[#00b386]">Verticals.</span>
            </h2>
            <p className="text-[#555] text-lg max-w-2xl mx-auto">
              Explore our innovative platforms designed to revolutionise your blockchain, trading, and investment experience.
            </p>
          </motion.div>
        </div>

        {/* Main cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {mainCards.map((card) => (
            <motion.div key={card.name} variants={cardVariants} className="group light-card overflow-hidden">
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-[#f7f8fa]">
                {card.image && (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: card.tagColor + "18", color: card.tagColor }}
                  >
                    {card.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{card.name}</h3>
                <p className="text-sm text-[#555] leading-relaxed mb-4">{card.description}</p>
                {card.url && (
                  <Link
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00b386] hover:text-[#00875f] transition-colors"
                  >
                    Visit {card.name} <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Secondary verticals */}
        <div>
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-5 text-center">Additional Investment Verticals</h3>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {secondaryCards.map((card) => (
              <motion.div
                key={card.name}
                variants={cardVariants}
                className="light-card p-5 flex items-start gap-4"
              >
                <span className="text-2xl flex-shrink-0">{card.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#1a1a1a] text-sm">{card.name}</h4>
                    {card.comingSoon && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666] leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
