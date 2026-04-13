"use client";
import Image from "next/image";
import { motion } from "framer-motion";

type Tier = { tier: string; price: number; items: string[]; goal: string };

const DATA: Tier[] = [
  { tier: "Starter Academy", price: 50, items: ["Basics of Crypto & Blockchain", "Intro to Unilevel Business Model"], goal: "Kickstart journey with foundations." },
  { tier: "Bronze Academy", price: 100, items: ["Affiliate Marketing Basics", "Intro Wallets & Trading"], goal: "Build skills + start duplication." },
  { tier: "Silver Academy", price: 300, items: ["Technical Analysis Basics", "Duplication Workshops"], goal: "Handle first 50–100 team members." },
  { tier: "Gold Academy", price: 500, items: ["Leadership Blueprint", "Passive vs Active Income"], goal: "Transition to Leader Rank." },
  { tier: "Platinum Academy", price: 1000, items: ["Market Analysis", "Compliance & Taxation Basics"], goal: "Prepare for Manager Rank (1,000+ teams)." },
  { tier: "Titanium Academy", price: 2500, items: ["Multi-Country Network Growth", "Mastermind Access"], goal: "Train to become Director." },
  { tier: "Diamond Academy", price: 5000, items: ["CEO Mindset Training", "Investment Diversification"], goal: "Crown Ambassador Level." },
  { tier: "Crown Academy", price: 10000, items: ["Elite Global Leadership Training", "Direct 1-on-1 Mentorship", "Luxury Global Summits (Dubai/Thailand/Europe)", "Premium Business Expansion Tools"], goal: "Build global empire under SAGENEX." },
];

const tierImages: Record<string, string> = {
  "Titanium Academy": "/academy/3.png",
  "Diamond Academy": "/academy/4.png",
  "Crown Academy": "/academy/5.png",
};

function getTierRibbon(tier: string) {
  if (tier.includes("Platinum")) return { ribbon: "from-[#a78bfa] to-[#7c3aed]", price: "#7c3aed", wallet: "bg-purple-50 border-purple-200 text-purple-700" };
  if (tier.includes("Gold"))     return { ribbon: "from-[#b58a2b] to-[#f1d27a]", price: "#b58a2b", wallet: "bg-amber-50 border-amber-200 text-amber-700" };
  if (tier.includes("Silver"))   return { ribbon: "from-[#8e8f93] to-[#cfd3d6]", price: "#555", wallet: "bg-gray-50 border-gray-200 text-gray-600" };
  if (tier.includes("Bronze"))   return { ribbon: "from-[#7a4b2c] to-[#b5763a]", price: "#7a4b2c", wallet: "bg-orange-50 border-orange-200 text-orange-700" };
  if (tier.includes("Crown"))    return { ribbon: "from-[#1a1a1a] to-[#444]", price: "#1a1a1a", wallet: "bg-gray-50 border-gray-200 text-gray-700" };
  if (tier.includes("Diamond"))  return { ribbon: "from-[#0ea5e9] to-[#6366f1]", price: "#0ea5e9", wallet: "bg-sky-50 border-sky-200 text-sky-700" };
  if (tier.includes("Titanium")) return { ribbon: "from-[#475569] to-[#94a3b8]", price: "#475569", wallet: "bg-slate-50 border-slate-200 text-slate-600" };
  return { ribbon: "from-[#00b386] to-[#00875f]", price: "#00875f", wallet: "bg-[#e6f7f3] border-[#b2e5d8] text-[#00875f]" };
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 22 } } };

export default function SagenexAcademy() {
  return (
    <section id="academy" className="w-full bg-[#f7f8fa] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Sagenex Academy
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1a1a1a] mb-3 tracking-tight">
            LEARN, EARN &amp; LEAD
          </h2>
          <p className="text-[#555] text-lg max-w-3xl mx-auto">
            Eight progressive tracks from Starter to Crown — turning beginners into confident global leaders through structured, real-world training.
          </p>
        </div>

        {/* Tier grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {DATA.map((c) => {
            const { ribbon, price, wallet } = getTierRibbon(c.tier);
            const img = tierImages[c.tier];
            return (
              <motion.article
                key={c.tier}
                variants={item}
                whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
                className="bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
              >
                {/* Ribbon */}
                <div className={`bg-gradient-to-r ${ribbon} px-4 py-2.5 flex items-center justify-between`}>
                  <span className="text-sm font-bold text-white">{c.tier}</span>
                  {img && <Image src={img} alt={c.tier} width={28} height={28} className="h-7 w-7" />}
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-3xl font-extrabold mb-3" style={{ color: price }}>
                    <span className="text-base align-top" style={{ color: price }}>$</span>
                    {c.price.toLocaleString()}
                  </div>

                  <ul className="list-disc pl-4 space-y-1 text-sm text-[#555] min-h-[4.5rem] flex-1">
                    {c.items.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>

                  <div className={`mt-4 flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold ${wallet}`}>
                    <span className="text-xs tracking-wide opacity-75">E-WALLET</span>
                    <span>${c.price.toLocaleString()}</span>
                  </div>

                  <p className="mt-3 text-xs text-[#888]">
                    <span className="font-semibold text-[#444]">Goal:</span> {c.goal}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Footer tag line */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-[#555]">
          {["Learn + Earn model at all levels", "E-Wallet = Package value (no-risk learning)", "Recognition at each level with perks"].map(t => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b386]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
