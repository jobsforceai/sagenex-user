"use client";

/**
 * Collapsible "How Luxury Rewards Work" panel for the /rewards page.
 *
 * Folds in the tier-targets + universal-rules + additional-rules content
 * that previously lived on the standalone /rewards/luxury page. Closed by
 * default so it doesn't dominate the main rewards layout; users can
 * expand it when they want to read the rules.
 */
import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Coins,
  Crown,
  Gift,
  Medal,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
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
    tagline: "Tech & travel reward",
    icon: Sparkles,
    gradient: "from-emerald-600 via-emerald-700 to-emerald-900",
  },
  {
    id: "30L",
    name: "Mid Tier",
    totalBusiness: "₹30,00,000",
    directBusiness: "₹1,50,000",
    activeLegs: "3",
    cycle: "90 Days",
    tagline: "Bike & travel reward",
    icon: Trophy,
    gradient: "from-blue-600 via-blue-700 to-blue-900",
  },
  {
    id: "50L",
    name: "Elite Tier",
    totalBusiness: "₹50,00,000",
    directBusiness: "₹2,50,000",
    activeLegs: "4",
    cycle: "120 Days",
    tagline: "Office & car reward",
    icon: Target,
    gradient: "from-violet-600 via-violet-700 to-violet-900",
  },
  {
    id: "1CR",
    name: "Crown Tier",
    totalBusiness: "₹1,00,00,000",
    directBusiness: "₹5,00,000",
    activeLegs: "5",
    cycle: "120 Days",
    tagline: "Crown luxury reward",
    icon: Crown,
    gradient: "from-amber-500 via-amber-700 to-amber-900",
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
        <div className="space-y-7 border-t border-slate-200/70 p-5 sm:p-6">
          {/* Tier targets — 4 gradient cards with white text */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Luxury Reward Targets</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tierRules.map((tier) => {
                const Icon = tier.icon;
                return (
                  <article
                    key={tier.id}
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.gradient} p-5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]`}
                  >
                    {/* subtle decorative noise / sparkle dots */}
                    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:18px_18px]" />

                    <div className="relative flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur">
                          <Coins className="h-3 w-3" />
                          {tier.id}
                        </div>
                        <h3 className="mt-3 text-2xl font-black leading-tight">{tier.name}</h3>
                        <p className="mt-1 text-xs font-bold text-white/75">{tier.tagline}</p>
                      </div>
                      <Icon className="h-9 w-9 shrink-0 rounded-2xl bg-white/15 p-1.5 text-white/90" />
                    </div>

                    <div className="relative mt-5 space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Team Biz</span>
                        <span className="text-base font-black">{tier.totalBusiness}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/70">Direct</span>
                        <span className="text-base font-black">{tier.directBusiness}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/70">Legs</p>
                          <p className="text-base font-black">Min {tier.activeLegs}</p>
                        </div>
                        <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/70">Cycle</p>
                          <p className="text-base font-black">{tier.cycle}</p>
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
