"use client";

/**
 * Collapsible "How Luxury Rewards Work" panel for the /rewards page.
 *
 * Folds in the tier-targets + universal-rules + additional-rules content
 * that previously lived on the standalone /rewards/luxury page. Closed by
 * default so it doesn't dominate the main rewards layout; users can
 * expand it when they want to read the rules.
 */
import Image from "next/image";
import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Gift,
  Medal,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const tierRules = [
  {
    id: "10L",
    name: "Starter Tier",
    totalBusiness: "₹10,00,000",
    directBusiness: "₹50,000",
    activeLegs: "2",
    cycle: "90 Days",
    accent: "emerald",
    image: "/rewards/luxury-tech-reward.png",
    visualLabel: "Tech and travel reward",
  },
  {
    id: "30L",
    name: "Mid Tier",
    totalBusiness: "₹30,00,000",
    directBusiness: "₹1,50,000",
    activeLegs: "3",
    cycle: "90 Days",
    accent: "blue",
    image: "/rewards/bike-travel-reward.png",
    visualLabel: "Bike and travel reward",
  },
  {
    id: "50L",
    name: "Elite Tier",
    totalBusiness: "₹50,00,000",
    directBusiness: "₹2,50,000",
    activeLegs: "4",
    cycle: "120 Days",
    accent: "violet",
    image: "/rewards/office-car-reward.png",
    visualLabel: "Office and car reward",
  },
  {
    id: "1CR",
    name: "Crown Tier",
    totalBusiness: "₹1,00,00,000",
    directBusiness: "₹5,00,000",
    activeLegs: "5",
    cycle: "120 Days",
    accent: "amber",
    image: "/rewards/crown-tier-reward.png",
    visualLabel: "Crown luxury reward",
  },
];

const universalRules = [
  {
    icon: Scale,
    title: "Power Leg Rule",
    value: "Max 50%",
    text: "No more than 50% of total team business can come from one single leg.",
  },
  {
    icon: RefreshCw,
    title: "Carry Forward",
    value: "Up to 50%",
    text: "Eligible volume can be carried forward for a maximum of 2 months only.",
  },
  {
    icon: CalendarDays,
    title: "Achievement Cycle",
    value: "90 / 120 Days",
    text: "Lower tiers run on 90-day cycles. Elite and Crown tiers run on 120-day cycles.",
  },
  {
    icon: ClipboardCheck,
    title: "Final Review",
    value: "Admin Approved",
    text: "Reward processing is subject to active status, policy checks, and final company approval.",
  },
];

const additionalRules = [
  {
    icon: ShieldCheck,
    title: "Active Status",
    text: "Achievers must remain active and meet company activity criteria at the time of reward processing.",
  },
  {
    icon: RefreshCw,
    title: "Reward Disbursement",
    text: "Rewards may be disbursed in phases as per company policy. The company decision is final.",
  },
  {
    icon: BadgeCheck,
    title: "Terms & Conditions",
    text: "The company reserves the right to modify, replace, or withdraw any reward without prior notice.",
  },
  {
    icon: Gift,
    title: "Reward Transfer",
    text: "Rewards are non-transferable and cannot be exchanged for cash or any other item.",
  },
  {
    icon: Trophy,
    title: "Fraud & Misconduct",
    text: "Fraud, policy violation, or misconduct will cancel the reward.",
  },
];

const tierTone: Record<string, { badge: string; soft: string; text: string }> = {
  emerald: { badge: "bg-emerald-700 text-white", soft: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
  blue:    { badge: "bg-blue-700 text-white",    soft: "bg-blue-50 border-blue-100",       text: "text-blue-700"    },
  violet:  { badge: "bg-violet-700 text-white",  soft: "bg-violet-50 border-violet-100",   text: "text-violet-700"  },
  amber:   { badge: "bg-amber-600 text-white",   soft: "bg-amber-50 border-amber-100",     text: "text-amber-700"   },
};

export default function LuxuryTierRulesPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 rounded-3xl p-5 text-left transition hover:bg-slate-50/60 sm:p-6"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <Medal className="h-10 w-10 rounded-2xl bg-amber-50 p-2.5 text-amber-600" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C81E4A]">Reward Milestones</p>
            <h2 className="mt-0.5 text-xl font-black text-[#0F172A] sm:text-2xl">How Luxury Rewards Work</h2>
            <p className="mt-1 hidden text-sm font-semibold text-slate-500 sm:block">
              Tier targets, the power-leg rule, and review policy. {isOpen ? "Click to collapse." : "Click to expand."}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="space-y-6 border-t border-slate-200/70 p-5 sm:p-6">
          {/* Tier targets — 4 cards */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Luxury Reward Targets</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {tierRules.map((tier) => {
                const tone = tierTone[tier.accent] ?? tierTone.emerald;
                return (
                  <article
                    key={tier.id}
                    className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
                  >
                    <div className={`relative h-24 border-b ${tone.soft}`}>
                      <div className={`absolute left-3 top-3 rounded-2xl px-2.5 py-1.5 text-xs font-black ${tone.badge}`}>
                        {tier.id}
                      </div>
                      <div className="absolute inset-x-4 bottom-0 top-2">
                        <Image
                          src={tier.image}
                          alt={tier.visualLabel}
                          fill
                          className="object-contain"
                          sizes="(min-width: 1280px) 240px, (min-width: 768px) 50vw, 100vw"
                        />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-base font-black text-[#0F172A]">{tier.name}</h3>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 text-xs">
                          <span className="font-black uppercase tracking-[0.1em] text-slate-400">Team</span>
                          <span className={`font-black ${tone.text}`}>{tier.totalBusiness}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-2.5 py-2 text-xs">
                          <span className="font-black uppercase tracking-[0.1em] text-slate-400">Direct</span>
                          <span className="font-black text-[#0F172A]">{tier.directBusiness}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Legs</p>
                            <p className="text-xs font-black text-[#0F172A]">Min {tier.activeLegs}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">Cycle</p>
                            <p className="text-xs font-black text-[#0F172A]">{tier.cycle}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Universal rules */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Universal Rules</p>
            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
              {universalRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <article key={rule.title} className="rounded-2xl border border-slate-200/70 bg-white p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <Icon className="h-8 w-8 rounded-xl bg-[#FFF1F4] p-1.5 text-[#C81E4A]" />
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">{rule.value}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-black text-[#0F172A]">{rule.title}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{rule.text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Additional / fine print */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Additional Rules</p>
            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-5">
              {additionalRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div key={rule.title} className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3">
                    <Icon className="h-7 w-7 rounded-lg bg-emerald-50 p-1.5 text-emerald-700" />
                    <p className="mt-2 text-xs font-black text-[#0F172A]">{rule.title}</p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-5 text-slate-500">{rule.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
