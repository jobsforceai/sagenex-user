"use client";
import { motion, AnimationGeneratorType } from "framer-motion";
import Image from "next/image";
import React from "react";
// import MarqueeHindi from "./level-marque";

type Tier = {
  tier: string;
  price: number;
  items: string[];
  goal: string;
};

const DATA: Tier[] = [
  {
    tier: "Starter Academy",
    price: 50,
    items: [
      "Basics of Crypto & Blockchain",
      "Intro to Unilevel Business Model",
    ],
    goal: "Kickstart journey with foundations.",
  },
  {
    tier: "Bronze Academy",
    price: 100,
    items: ["Affiliate Marketing Basics", "Intro Wallets & Trading"],
    goal: "Build skills + start duplication.",
  },
  {
    tier: "Silver Academy",
    price: 300,
    items: ["Technical Analysis Basics", "Duplication Workshops"],
    goal: "Handle first 50–100 team members.",
  },
  {
    tier: "Gold Academy",
    price: 500,
    items: ["Leadership Blueprint", "Passive vs Active Income"],
    goal: "Transition to Leader Rank.",
  },
  {
    tier: "Platinum Academy",
    price: 1000,
    items: ["Market Analysis", "Compliance & Taxation Basics"],
    goal: "Prepare for Manager Rank (1,000+ teams).",
  },
  {
    tier: "Titanium Academy",
    price: 2500,
    items: ["Multi-Country Network Growth", "Mastermind Access"],
    goal: "Train to become Director.",
  },
  {
    tier: "Diamond Academy",
    price: 5000,
    items: ["CEO Mindset Training", "Investment Diversification"],
    goal: "Crown Ambassador Level.",
  },
  {
    tier: "Crown Academy",
    price: 10000,
    items: [
      "Elite Global Leadership Training",
      "Direct 1-on-1 Mentorship with Founders",
      "Luxury Global Summits (Dubai/Thailand/Europe)",
      "Premium Business Expansion Tools",
    ],
    goal: "Build global empire under SAGENEX.",
  },
];

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 0 });

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as AnimationGeneratorType,
      damping: 22,
      stiffness: 220,
    },
  },
};

/** tier-specific accents (ribbon gradient + price color + ring color) */
function getTierTheme(tier: string) {
  if (tier.includes("Platinum"))
    return {
      ribbon: "from-[#a78bfa] to-[#7c3aed]",
      price: "text-[#d8b4fe]",
      ring: "rgba(139, 92, 246, .45)",
    };
  if (tier.includes("Gold"))
    return {
      ribbon: "from-[#b58a2b] to-[#f1d27a]",
      price: "text-[#f0d493]",
      ring: "rgba(241,210,122,.45)",
    };
  if (tier.includes("Silver"))
    return {
      ribbon: "from-[#8e8f93] to-[#cfd3d6]",
      price: "text-[#e5e7eb]",
      ring: "rgba(207,211,214,.45)",
    };
  if (tier.includes("Bronze"))
    return {
      ribbon: "from-[#7a4b2c] to-[#b5763a]",
      price: "text-[#e0b187]",
      ring: "rgba(181,118,58,.45)",
    };
  // default green/gold accent
  return {
    ribbon: "from-[#0f3d2e] to-[#1f5a45]",
    price: "text-[#d4b36a]",
    ring: "rgba(31,90,69,.45)",
  };
}

const tierImages: Record<string, string> = {
  "Titanium Academy": "/academy/3.png",
  "Diamond Academy": "/academy/4.png",
  "Crown Academy": "/academy/5.png",
};

export default function SagenexAcademy() {
  return (
    <section id="academy" className="relative overflow-x-hidden w-full bg-black py-16">
      {/* decorative background glows */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]">
        <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-[#1f5a45]/20 blur-3xl" />
        <div className="absolute -right-10 top-10 h-96 w-96 rounded-full bg-[#d4b36a]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <header className="text-center">
          <h1
            className="text-[clamp(48px,6vw,96px)] leading-[0.95] font-extrabold tracking-tight text-left
                       text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 to-white"
          >
            ACADEMY
          </h1>


          <p className="mt-6 max-w-4xl text-center md:text-right md:ml-auto text-[17px]  text-white/85">
            <span className="font-semibold text-emerald-300">SAGENEX</span> Academy is our structured “learn–earn–lead” program that
            turns beginners into confident leaders through eight progressive
            tracks—Starter, Bronze, Silver, Gold, Platinum, Titanium, Diamond,
            and Crown. Each tier unlocks focused, real-world training: from
            crypto and blockchain fundamentals, affiliate marketing, wallets
            and trading, and technical analysis with duplication workshops, to
            leadership blueprints, market analysis, compliance & taxation
            basics, multi-country network growth, mastermind access, CEO-level
            mindset and investment diversification.
          </p>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            LEARN, EARN &amp; LEAD
          </h2>
          {/* <p className="mt-2 text-sm font-medium text-[#b6c8bf] sm:text-base">
            Master Crypto, Master Growth
          </p> */}
        </header>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {DATA.map((c) => {
            const { ribbon, price } = getTierTheme(c.tier);
            const wallet = `$${fmt(c.price)}`; // wallet mirrors price
            const tierImage = tierImages[c.tier];

            return (
              <motion.article
                key={c.tier}
                variants={item}
                whileHover={{
                  y: -6,
                  boxShadow: "0px 18px 40px rgba(0,0,0,.55)",
                }}
                className="group relative flex h-full flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-[#101613] to-[#0c110e] p-4 text-white shadow-[0_10px_24px_rgba(0,0,0,.45)]"
              >
                {/* Ribbon */}
                <div
                  className={`flex items-center justify-between rounded-lg bg-gradient-to-r ${ribbon} px-3 py-2 text-sm font-bold tracking-tight text-white ring-1 ring-white/10`}
                >
                  <span>{c.tier}</span>
                  {tierImage && (
                    <Image
                      src={tierImage}
                      alt={`${c.tier} badge`}
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  )}
                </div>

                {/* Content grows to keep consistent card heights */}
                <div className="flex-1 pt-3">
                  {/* Price */}
                  <div className={`text-3xl font-extrabold ${price}`}>
                    <span className="align-top text-base text-[#f3e3ba]">
                      $
                    </span>
                    {fmt(c.price)}
                  </div>

                  {/* Bullets (reserved height for consistency across cards) */}
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#cfe0d7] min-h-[4.5rem]">
                    {c.items.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Wallet */}
                <div className="mt-3 flex items-center justify-between rounded-xl border border-[#1f5a45]/60 bg-[#1f5a45]/20 px-3 py-2 font-semibold text-[#ddf6ea]">
                  <span className="text-xs tracking-wide text-white/80">
                    E-WALLET
                  </span>
                  <span className="text-sm">{wallet}</span>
                </div>

                {/* Goal */}
                <p className="mt-3 text-sm text-[#b6c8bf]">
                  <span className="font-semibold text-white/90">Goal:</span>{" "}
                  {c.goal}
                </p>

                {/* Glow on hover */}
                <div
                  className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-100"
                  style={{
                    background:
                      `radial-gradient(60% 50% at 50% 0%, ${getTierTheme(c.tier).ring}, transparent 70%)`,
                  }}
                />
              </motion.article>
            );
          })}
        </motion.div>

        {/* Footer benefits */}
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-6 text-center text-sm font-semibold text-[#d8e8e0]">
          <span>Learn + Earn model at all levels</span>
          <Dot />
          <span>E-Wallet = equal to package (no risk learning)</span>
          <Dot />
          <span>Prepares leaders for duplication &amp; expansion</span>
          <Dot />
          <span>Recognition at each level with exclusive perks</span>
        </div>
      </div>
      {/* <div className="mt-12">
        <MarqueeHindi tilt={1}/>
      </div> */}
    </section>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-[#d4b36a]/80" />;
}
