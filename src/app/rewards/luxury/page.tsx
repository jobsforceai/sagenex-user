"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Crown,
  Gift,
  Medal,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import LuxuryRewardsCard from "@/app/components/LuxuryRewardsCard";
import { useAuth } from "@/app/context/AuthContext";

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

const tierTone: Record<string, { badge: string; rail: string; soft: string; text: string }> = {
  emerald: {
    badge: "bg-emerald-700 text-white",
    rail: "bg-emerald-500",
    soft: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-700",
  },
  blue: {
    badge: "bg-blue-700 text-white",
    rail: "bg-blue-500",
    soft: "bg-blue-50 border-blue-100",
    text: "text-blue-700",
  },
  violet: {
    badge: "bg-violet-700 text-white",
    rail: "bg-violet-500",
    soft: "bg-violet-50 border-violet-100",
    text: "text-violet-700",
  },
  amber: {
    badge: "bg-amber-600 text-white",
    rail: "bg-amber-500",
    soft: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
  },
};

const RuleMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-3 backdrop-blur">
    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/55">{label}</p>
    <p className="mt-1 text-base font-black text-white">{value}</p>
  </div>
);

export default function LuxuryRewardsPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [loading, isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-3 pb-24 pt-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-[#063B22] text-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(200,30,74,0.22),transparent_30%),linear-gradient(135deg,#063B22_0%,#062D1E_50%,#7A001F_100%)]" />
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.32)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-stretch lg:p-9">
            <div className="flex flex-col justify-between gap-7">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">
                <Crown className="h-3.5 w-3.5 text-amber-300" />
                Sagenex SGX Rewards
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                  Your Luxury Rewards
                </h1>
                <p className="mt-3 text-lg font-black text-amber-200 sm:text-2xl">Progress. Targets. Next milestone.</p>
                <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/72 sm:text-base">
                  See the luxury tier you are chasing, what is missing, and the business milestones needed to unlock your reward.
                </p>
              </div>
              <div className="grid max-w-2xl grid-cols-3 gap-2">
                <RuleMetric label="Power cap" value="50%" />
                <RuleMetric label="Carry" value="2 mo" />
                <RuleMetric label="Cycle" value="90/120d" />
              </div>
            </div>

            <div className="relative min-h-[260px] overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-5 backdrop-blur">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_42%,rgba(245,158,11,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.035))]" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100">Top Luxury Tier</p>
                <p className="mt-2 text-5xl font-black">1CR</p>
                <p className="mt-1 text-sm font-bold text-white/68">Crown tier reference</p>
              </div>
              <Image
                src="/rewards/crown-tier-reward.png"
                alt="Crown tier luxury reward"
                width={420}
                height={310}
                className="absolute -bottom-5 -right-8 h-56 w-72 object-contain drop-shadow-[0_24px_45px_rgba(0,0,0,0.32)] sm:h-64 sm:w-80"
                priority
              />
              <div className="absolute bottom-5 left-5 z-10 rounded-2xl border border-white/15 bg-black/15 px-4 py-3 backdrop-blur">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/55">Highest Target</p>
                <p className="mt-1 text-sm font-black text-white">₹1Cr team business</p>
              </div>
            </div>
          </div>
        </section>

        <LuxuryRewardsCard />

        <section className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C81E4A]">Reward Milestones</p>
              <h2 className="mt-1 text-2xl font-black text-[#0F172A] sm:text-3xl">Luxury Reward Targets</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                These are the targets your progress card compares against.
              </p>
            </div>
            <Medal className="h-11 w-11 rounded-2xl bg-amber-50 p-2.5 text-amber-600" />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {tierRules.map((tier) => {
              const tone = tierTone[tier.accent];
              return (
                <article
                  key={tier.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)]"
                >
                  <div className={`relative h-28 border-b ${tone.soft}`}>
                    <div className={`absolute left-4 top-4 rounded-2xl px-3 py-2 text-sm font-black ${tone.badge}`}>
                      {tier.id}
                    </div>
                    <div className="absolute inset-x-5 bottom-0 top-2">
                      <Image
                        src={tier.image}
                        alt={tier.visualLabel}
                        fill
                        className="object-contain transition duration-300 group-hover:scale-105"
                        sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Reward Tier</p>
                    <h3 className="mt-1 text-xl font-black leading-tight text-[#0F172A]">{tier.name}</h3>
                    <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{tier.visualLabel}</p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Team</span>
                        <span className={`text-base font-black ${tone.text}`}>{tier.totalBusiness}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Direct</span>
                        <span className="text-base font-black text-[#0F172A]">{tier.directBusiness}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Legs</p>
                          <p className="text-base font-black text-[#0F172A]">Min {tier.activeLegs}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">Cycle</p>
                          <p className="text-base font-black text-[#0F172A]">{tier.cycle}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {universalRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <article key={rule.title} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-10 w-10 rounded-2xl bg-[#FFF1F4] p-2 text-[#C81E4A]" />
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{rule.value}</span>
                </div>
                <h3 className="mt-4 text-lg font-black text-[#0F172A]">{rule.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{rule.text}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-emerald-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Additional Rules</p>
              <h2 className="text-2xl font-black text-[#0F172A]">Applicable To All Luxury Tiers</h2>
            </div>
            <p className="max-w-2xl text-xs font-semibold text-slate-500">
              Rewards are optional, non-transferable, and subject to final company review.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {additionalRules.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.title} className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                  <Icon className="h-8 w-8 rounded-xl bg-emerald-50 p-1.5 text-emerald-700" />
                  <p className="mt-3 text-sm font-black text-[#0F172A]">{rule.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{rule.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-r from-[#063B22] via-[#0B5A35] to-[#7A001F] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-10 w-10 rounded-2xl bg-white/10 p-2 text-amber-200" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">Leadership Standard</p>
                <h2 className="text-2xl font-black">Build Leaders. Grow Together.</h2>
              </div>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-white/75">
              These rules are designed to ensure fairness, sustainability, and long-term success for every leader.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
