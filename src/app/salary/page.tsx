"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { getRankProgress } from "@/actions/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Crown,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

interface RankProgress {
  rank: {
    name: string;
    badge: string;
    achievedAt: string | null;
    consecutiveMonthsMissed: number;
  };
  performanceRank: {
    name: string;
    badge: string;
    salary: number;
  };
  salaryEligibility: {
    isEligible: boolean;
    requirements?: RankRequirements;
  };
  progress: {
    nextRankName?: string | null;
    requirements?: RankRequirements | null;
  };
  legDetails: {
    userId: string;
    monthlyBusiness: number;
    activeTeam: number;
  }[];
  achieverBonus: {
    direct3X: number;
    direct4X: number;
    base3X: number;
    extra3X: number;
    extra4X: number;
    projectedBonus: number;
  } | null;
}

interface RankRequirements {
  directs?: { current: number; required: number };
  requiresActivePackage?: { current: boolean; required: true };
  direct3X?: { current: number; required: number };
  orCondition?: {
    direct3X: { current: number; required: number };
    direct4X: { current: number; required: number };
  };
}

type SalaryRange = { min: number; max: number; currency: "INR" } | null;

type RankStructureItem = {
  level: number;
  key: string;
  name: string;
  salaryRange: SalaryRange;
  asset: string;
  requirements: string[];
  bonusRules: string[];
  condition?: string;
  accent: string;
};

const salaryAssets = {
  hero: "/salary/hero-rupee-growth.png",
  member: "/salary/rank-member-shield.png",
  builder: "/salary/rank-builder-team.png",
  leader: "/salary/rank-leader-shield.png",
  manager: "/salary/rank-manager-crown.png",
  director: "/salary/rank-director-gold-shield.png",
  elite: "/salary/rank-elite-director-crown.png",
  currentSalary: "/salary/icon-current-salary-wallet.png",
  potentialSalary: "/salary/icon-potential-salary-growth.png",
  nextPayout: "/salary/icon-next-payout-calendar.png",
} as const;

const rankStructure: RankStructureItem[] = [
  {
    level: 0,
    key: "member",
    name: "Member",
    salaryRange: null,
    asset: salaryAssets.member,
    requirements: ["Start your SAGENEX journey"],
    bonusRules: [],
    condition: "No salary",
    accent: "from-[#FFF1F4] to-white",
  },
  {
    level: 1,
    key: "starter",
    name: "Starter",
    salaryRange: null,
    asset: salaryAssets.member,
    requirements: ["6 direct referrals"],
    bonusRules: [],
    condition: "Active package required",
    accent: "from-[#FFF1F4] to-white",
  },
  {
    level: 2,
    key: "builder",
    name: "Builder",
    salaryRange: { min: 30000, max: 50000, currency: "INR" },
    asset: salaryAssets.builder,
    requirements: ["3× Direct 3X Achievers", "OR 2×3X + 1×4X"],
    bonusRules: ["Each extra 3X: ₹4,500", "Each extra 4X: ₹9,000"],
    accent: "from-[#ECFDF5] to-white",
  },
  {
    level: 3,
    key: "leader",
    name: "Leader",
    salaryRange: { min: 80000, max: 120000, currency: "INR" },
    asset: salaryAssets.leader,
    requirements: ["6× Direct 3X Achievers", "OR 4×3X + 1×4X"],
    bonusRules: ["Each extra 3X: ₹6,750", "Each extra 4X: ₹13,500"],
    accent: "from-blue-50 to-white",
  },
  {
    level: 4,
    key: "manager",
    name: "Manager",
    salaryRange: { min: 180000, max: 250000, currency: "INR" },
    asset: salaryAssets.manager,
    requirements: ["12× Direct 3X Achievers", "OR 8×3X + 2×4X"],
    bonusRules: ["Each extra 3X: ₹9,000", "Each extra 4X: ₹18,000"],
    accent: "from-violet-50 to-white",
  },
  {
    level: 5,
    key: "director",
    name: "Director",
    salaryRange: { min: 350000, max: 500000, currency: "INR" },
    asset: salaryAssets.director,
    requirements: ["20× Direct 3X Achievers", "OR 12×3X + 4×4X"],
    bonusRules: ["Each extra 3X: ₹13,500", "Each extra 4X: ₹27,000"],
    accent: "from-amber-50 to-white",
  },
  {
    level: 6,
    key: "elite-director",
    name: "Elite Director",
    salaryRange: { min: 600000, max: 1000000, currency: "INR" },
    asset: salaryAssets.elite,
    requirements: ["35× Direct 3X Achievers", "OR 20×3X + 6×4X"],
    bonusRules: ["Each extra 3X: ₹18,000", "Each extra 4X: ₹36,000"],
    accent: "from-purple-50 to-amber-50",
  },
  {
    level: 7,
    key: "crown-elite",
    name: "Crown Elite",
    salaryRange: { min: 1200000, max: 1200000, currency: "INR" },
    asset: salaryAssets.elite,
    requirements: ["60× Direct 3X Achievers", "OR 30×3X + 10×4X"],
    bonusRules: ["Leadership Bonus Pool", "Global Team Overrides"],
    accent: "from-[#1E1240] to-[#3B0764]",
  },
];

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatSalaryRange = (range: SalaryRange) => {
  if (!range) return "No salary";
  if (range.min === range.max) return formatCurrency(range.min);
  return `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
};

const getRankConfig = (rankName?: string | null) =>
  rankStructure.find((rank) => rank.name === rankName) ?? rankStructure[0];

const getRequirementProgress = (requirements?: RankRequirements | null) => {
  if (!requirements) return { current: 0, required: 1, percent: 0, label: "No active target" };
  if (requirements.directs) {
    return {
      current: requirements.directs.current,
      required: requirements.directs.required,
      percent: Math.min(100, Math.round((requirements.directs.current / requirements.directs.required) * 100)),
      label: "Direct Referrals",
    };
  }
  if (requirements.direct3X) {
    return {
      current: requirements.direct3X.current,
      required: requirements.direct3X.required,
      percent: Math.min(100, Math.round((requirements.direct3X.current / requirements.direct3X.required) * 100)),
      label: "Direct 3X Achievers",
    };
  }
  if (requirements.orCondition) {
    const current = requirements.orCondition.direct3X.current + requirements.orCondition.direct4X.current;
    const required = requirements.orCondition.direct3X.required + requirements.orCondition.direct4X.required;
    return {
      current,
      required,
      percent: required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0,
      label: "Mixed Achievers",
    };
  }
  return { current: 0, required: 1, percent: 0, label: "Progress" };
};

const SalaryHeader = ({ onRulesClick }: { onRulesClick: () => void }) => (
  <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Button
          asChild
          variant="outline"
          className="mb-5 h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-bold text-[#0F172A] hover:bg-slate-50 sm:w-auto"
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
          Salary & Rank <span aria-hidden="true">👑</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B] sm:text-base">
          Track your rank, payout status, and qualification progress.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto lg:pr-48">
        <Button
          type="button"
          variant="outline"
          onClick={onRulesClick}
          className="h-12 min-w-0 rounded-xl border-slate-200 bg-white px-3 text-sm font-bold text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50 sm:px-4"
        >
          <Info className="mr-2 h-4 w-4 shrink-0 text-amber-500" />
          <span className="truncate">Rules & Qualification</span>
        </Button>
      </div>
    </div>
    <Image
      src={salaryAssets.hero}
      alt="Rupee growth visual"
      width={260}
      height={220}
      priority
      className="pointer-events-none absolute -right-3 -top-8 hidden h-56 w-64 object-contain drop-shadow-2xl lg:block"
    />
  </header>
);

const SalaryHeroCard = ({
  currentRank,
  nextRank,
  progress,
}: {
  currentRank: RankStructureItem;
  nextRank: RankStructureItem;
  progress: { current: number; required: number; percent: number; label: string };
}) => (
  <section className="wallet-red-surface relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_55%,#35000D_100%)] p-4 text-white shadow-[0_24px_70px_rgba(122,0,31,0.25)] sm:p-8">
    <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:24px_24px]" />
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F59E0B]/25 blur-3xl" />
    <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <Image src={currentRank.asset} alt={`${currentRank.name} rank badge`} width={120} height={120} className="h-20 w-20 object-contain sm:h-28 sm:w-28" />
        <div className="min-w-0">
          <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
            Your Current Rank
          </p>
          <h2 className="mt-2 break-words text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
            {currentRank.name}
          </h2>
          <p className="wallet-red-soft mt-3 max-w-xl text-sm font-semibold text-white/82">
            {currentRank.name === "Member"
              ? "You have not yet met this month’s performance requirements."
              : "Your current leadership rank is active in the SAGENEX progression system."}
          </p>
          <span className="wallet-red-soft mt-4 inline-flex rounded-full border border-white/14 bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-white/88">
            {currentRank.name}
          </span>
        </div>
      </div>
      <div className="rounded-3xl border border-white/14 bg-white/12 p-4 backdrop-blur sm:p-5">
        <div className="flex items-center gap-4">
          <Image src={nextRank.asset} alt={`${nextRank.name} rank badge`} width={74} height={74} className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.12em] text-white/64">
              Next Rank Preview
            </p>
            <p className="mt-1 break-words text-xl font-black text-white sm:text-2xl">{nextRank.name}</p>
            <p className="wallet-red-soft mt-1 break-words text-sm font-bold text-white/80">
              {formatSalaryRange(nextRank.salaryRange)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="wallet-red-muted text-xs font-bold text-white/70">{progress.label}</span>
            <span className="text-sm font-black text-white">
              {progress.current} / {progress.required}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/18">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SalaryMetricCard = ({ title, value, subtitle, icon }: { title: string; value: string; subtitle: string; icon: string }) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">{title}</p>
        <p className="mt-2 break-words text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">{value}</p>
        <p className="mt-2 text-sm text-[#64748B]">{subtitle}</p>
      </div>
      <Image src={icon} alt="" width={64} height={64} className="h-12 w-12 shrink-0 object-contain sm:h-16 sm:w-16" />
    </div>
  </div>
);

const RankProgressCard = ({
  starter,
  nextRankName,
  onRulesClick,
}: {
  starter: { current: number; required: number; percent: number; complete: boolean };
  nextRankName: string;
  onRulesClick: () => void;
}) => (
  <section className="grid gap-5 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
    <div>
      <h2 className="text-xl font-black text-[#0F172A]">Progress Towards Starter</h2>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-[#64748B]">Direct Referrals</span>
          <span className="font-black text-[#0F172A]">{starter.current} / {starter.required}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[#C8103E]" style={{ width: `${starter.percent}%` }} />
        </div>
      </div>
      {starter.complete && (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-[#ECFDF5] p-4">
          <p className="flex items-center gap-2 font-black text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Direct referral requirement completed!
          </p>
          <p className="mt-1 text-sm text-emerald-700/80">Great job! You’ve completed this requirement.</p>
        </div>
      )}
    </div>
    <div className="rounded-3xl bg-[#FFF1F4] p-5">
      <Target className="h-8 w-8 text-[#C8103E]" />
      <p className="mt-4 text-sm font-black uppercase tracking-[0.12em] text-[#C8103E]">Next Target</p>
      <h3 className="mt-2 text-2xl font-black text-[#0F172A]">Build 3x Achievers</h3>
      <p className="mt-2 text-sm text-[#64748B]">To reach {nextRankName}</p>
      <Button
        type="button"
        onClick={onRulesClick}
        className="wallet-red-control mt-5 h-12 w-full rounded-2xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] text-white hover:from-[#C8103E] hover:to-[#68001A]"
      >
        View Qualification Rules
      </Button>
    </div>
  </section>
);

const LegDetailsCard = ({ legs }: { legs: RankProgress["legDetails"] }) => (
  <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-black text-[#0F172A]">Leg Details (This Month)</h2>
        <p className="mt-1 text-sm text-[#64748B]">Monthly business and active team by leg.</p>
      </div>
      <Button variant="outline" className="h-11 w-full rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50 sm:w-auto">
        View All Legs
      </Button>
    </div>
    {legs.length === 0 ? (
      <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-[#64748B]">
        No active leg data for this month yet.
      </p>
    ) : (
      <>
        <div className="mt-5 hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.08em] text-[#64748B]">
                <th className="px-3 py-3 text-left">Leg/User ID</th>
                <th className="px-3 py-3 text-right">Monthly Business</th>
                <th className="px-3 py-3 text-right">Active Team</th>
                <th className="px-3 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {legs.map((leg) => (
                <tr key={leg.userId}>
                  <td className="px-3 py-4 font-black text-[#0F172A]">{leg.userId}</td>
                  <td className="px-3 py-4 text-right font-bold text-[#0F172A]">{formatCurrency(leg.monthlyBusiness)}</td>
                  <td className="px-3 py-4 text-right text-[#64748B]">{leg.activeTeam.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-4 text-right">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 md:hidden">
          {legs.map((leg) => (
            <div key={leg.userId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-[#0F172A]">{leg.userId}</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <p className="mt-3 text-sm text-[#64748B]">Monthly Business: <span className="font-bold text-[#0F172A]">{formatCurrency(leg.monthlyBusiness)}</span></p>
              <p className="mt-1 text-sm text-[#64748B]">Active Team: <span className="font-bold text-[#0F172A]">{leg.activeTeam.toLocaleString("en-IN")}</span></p>
            </div>
          ))}
        </div>
      </>
    )}
  </section>
);

const RankRowCard = ({ rank, isCurrent }: { rank: RankStructureItem; isCurrent: boolean }) => {
  const isDark = rank.key === "crown-elite";
  return (
    <details className={`group rounded-3xl border border-slate-200/70 bg-gradient-to-br ${rank.accent} p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5 ${isDark ? "salary-dark-rank" : ""}`}>
      <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Image src={rank.asset} alt={`${rank.name} rank badge`} width={68} height={68} className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`break-words text-lg font-black sm:text-xl ${isDark ? "text-white" : "text-[#0F172A]"}`}>{rank.name}</h3>
              {isCurrent && (
                <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-xs font-black text-[#C8103E]">Current Rank</span>
              )}
            </div>
            <p className={`mt-1 break-words text-sm ${isDark ? "salary-dark-muted" : "text-[#64748B]"}`}>
              {rank.condition || rank.requirements.join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 items-center justify-between gap-4 md:w-auto md:justify-end">
          <p className={`min-w-0 break-words text-left text-base font-black sm:text-lg md:text-right ${isDark ? "salary-dark-gold" : "text-[#0F172A]"}`}>
            {formatSalaryRange(rank.salaryRange)}
          </p>
          <ChevronDown className={`h-5 w-5 shrink-0 transition group-open:rotate-180 ${isDark ? "text-white" : "text-[#64748B]"}`} />
        </div>
      </summary>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl p-4 ${isDark ? "bg-white/10 text-white" : "bg-white/70"}`}>
          <p className="text-sm font-black uppercase tracking-[0.08em]">Requirements</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {rank.requirements.map((item) => (
              <span key={item} className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? "bg-white/10 text-white" : "bg-slate-100 text-[#0F172A]"}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className={`rounded-2xl p-4 ${isDark ? "bg-white/10 text-white" : "bg-white/70"}`}>
          <p className="text-sm font-black uppercase tracking-[0.08em]">Bonus Details</p>
          {rank.bonusRules.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {rank.bonusRules.map((item) => (
                <span key={item} className={`rounded-full px-3 py-1 text-xs font-bold ${isDark ? "bg-amber-300/15 text-amber-100" : "bg-emerald-50 text-emerald-700"}`}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className={`mt-3 text-sm ${isDark ? "salary-dark-muted" : "text-[#64748B]"}`}>No achiever bonus at this rank.</p>
          )}
        </div>
      </div>
    </details>
  );
};

const RankStructureCard = ({ currentRankName }: { currentRankName: string }) => (
  <section>
    <div className="mb-4">
      <h2 className="text-xl font-black text-[#0F172A] sm:text-2xl">Rank Structure & Monthly Salary</h2>
      <p className="mt-1 text-sm text-[#64748B]">Requirements are evaluated every month.</p>
    </div>
    <div className="space-y-4">
      {rankStructure.filter((rank) => rank.level >= 1).map((rank) => (
        <RankRowCard key={rank.key} rank={rank} isCurrent={rank.name === currentRankName} />
      ))}
    </div>
  </section>
);

const BottomRulesGrid = ({ currentMultiplier }: { currentMultiplier: number }) => (
  <section className="grid gap-5 lg:grid-cols-3">
    <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
      <Zap className="h-8 w-8 text-[#C8103E]" />
      <h3 className="mt-4 text-lg font-black text-[#0F172A]">Earnings Multiplier</h3>
      <p className="mt-1 text-sm text-[#64748B]">Monthly Qualification</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="rounded-2xl bg-[#ECFDF5] p-4">
          <p className="font-black text-emerald-700">3x Multiplier</p>
          <ul className="mt-2 space-y-1 text-xs text-emerald-800/80">
            <li>Minimum 3 active legs</li>
            <li>Each leg ≥ ₹1.5L monthly business</li>
            <li>Total team business ≥ ₹5L</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="font-black text-amber-700">4x Multiplier</p>
          <ul className="mt-2 space-y-1 text-xs text-amber-800/80">
            <li>Minimum 4 active legs</li>
            <li>Each leg ≥ ₹2L monthly business</li>
            <li>Total team business ≥ ₹10L</li>
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs font-bold text-[#64748B]">Current multiplier: {currentMultiplier}x · Recalculated every month.</p>
    </div>

    <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
      <ShieldCheck className="h-8 w-8 text-emerald-600" />
      <h3 className="mt-4 text-lg font-black text-[#0F172A]">Salary Grace Period Rules</h3>
      <div className="mt-5 space-y-3">
        {[
          ["Met targets", "Receive 100% of your rank's monthly salary.", "bg-emerald-50 text-emerald-700"],
          ["Missed 1 month", "Grace period — receive 50% salary this month.", "bg-amber-50 text-amber-700"],
          ["Missed 2+ months", "Salary paused until targets are met again.", "bg-[#FFF1F4] text-[#C8103E]"],
        ].map(([title, text, klass]) => (
          <div key={title} className={`rounded-2xl p-3 ${klass}`}>
            <p className="font-black">{title}</p>
            <p className="mt-1 text-xs opacity-80">{text}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#64748B]">Salary is credited at the end of each calendar month after admin review.</p>
    </div>

    <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
      <Info className="h-8 w-8 text-[#C8103E]" />
      <h3 className="mt-4 text-lg font-black text-[#0F172A]">Important Conditions</h3>
      <ul className="mt-5 space-y-3 text-sm text-[#64748B]">
        {[
          "Achievers must be active.",
          "Max 50% achievers from one leg.",
          "Achiever bonus is recalculated every month.",
          "4X achievers count higher than 3X.",
          "Company terms and conditions apply.",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const LoadingSkeleton = () => (
  <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  </main>
);

const SalaryPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const fetchRankProgress = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const res = await getRankProgress();
      if (res.error) setError(res.error);
      else setRankProgress(res);
    } catch {
      setError("An unexpected error occurred while fetching rank progress.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const diff = endOfMonth.getTime() - now.getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalTime = endOfMonth.getTime() - startOfMonth.getTime();
      setProgressPercentage(((now.getTime() - startOfMonth.getTime()) / totalTime) * 100);
      if (diff <= 0) {
        setCountdown("Processing...");
        clearInterval(timer);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!token) return;
    fetchRankProgress();
  }, [token, isAuthenticated, loading, router]);

  const derived = useMemo(() => {
    if (!rankProgress) return null;
    const currentRank = getRankConfig(rankProgress.rank.name);
    const nextRank = getRankConfig(rankProgress.progress?.nextRankName || "Builder");
    const progress = getRequirementProgress(rankProgress.progress?.requirements);
    const starterDirects =
      rankProgress.progress?.requirements?.directs ||
      rankProgress.salaryEligibility.requirements?.directs ||
      ({ current: 0, required: 6 } as { current: number; required: number });
    const starterPercent = Math.min(100, Math.round((starterDirects.current / starterDirects.required) * 100));
    const rankDef = getRankConfig(rankProgress.performanceRank.name);
    const graceMultiplier = rankProgress.rank.consecutiveMonthsMissed === 1 ? 0.5 : 1;
    const currentSalary = rankProgress.salaryEligibility.isEligible
      ? Math.round(rankProgress.performanceRank.salary * graceMultiplier)
      : 0;
    const potentialSalaryMin = nextRank.salaryRange?.min ?? rankDef.salaryRange?.min ?? rankProgress.performanceRank.salary;
    const potentialSalaryMax = nextRank.salaryRange?.max ?? rankDef.salaryRange?.max ?? rankProgress.performanceRank.salary;

    return {
      currentRank,
      nextRank,
      progress,
      starter: {
        current: starterDirects.current,
        required: starterDirects.required,
        percent: starterPercent,
        complete: starterDirects.current >= starterDirects.required,
      },
      currentSalary,
      potentialSalaryMin,
      potentialSalaryMax,
      graceMultiplier,
    };
  }, [rankProgress]);

  if (loading || dataLoading) return <LoadingSkeleton />;

  if (error || !rankProgress || !derived) {
    return (
      <main className="dashboard-light-scope flex min-h-screen overflow-x-hidden bg-[#F8FAFC] p-4 sm:items-center sm:justify-center sm:p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-lg font-black text-red-700">Unable to load salary data</p>
          <p className="mt-2 text-sm text-red-600">{error || "No salary/rank data was returned."}</p>
          <Button onClick={fetchRankProgress} className="wallet-red-control mt-5 bg-[#C8103E] text-white hover:bg-[#A90D32]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <SalaryHeader
          onRulesClick={() =>
            setInfoMessage("Qualification rules are evaluated monthly using active direct achievers, leg performance, and admin-reviewed salary rules.")
          }
        />
        {infoMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{infoMessage}</p>
          </div>
        )}

        <SalaryHeroCard currentRank={derived.currentRank} nextRank={derived.nextRank} progress={derived.progress} />

        <section className="grid gap-4 lg:grid-cols-3">
          <SalaryMetricCard
            title="Current Salary"
            value={formatCurrency(derived.currentSalary)}
            subtitle={derived.currentSalary > 0 ? "Eligible this cycle" : "No payout earned yet"}
            icon={salaryAssets.currentSalary}
          />
          <SalaryMetricCard
            title="Potential Salary"
            value={`${formatCurrency(derived.potentialSalaryMin)} – ${formatCurrency(derived.potentialSalaryMax)}`}
            subtitle={`At ${derived.nextRank.name} Rank`}
            icon={salaryAssets.potentialSalary}
          />
          <SalaryMetricCard
            title="Next Payout"
            value={rankProgress.salaryEligibility.isEligible ? countdown : "Not started"}
            subtitle={rankProgress.salaryEligibility.isEligible ? `${progressPercentage.toFixed(1)}% of cycle completed` : "Complete qualification rules"}
            icon={salaryAssets.nextPayout}
          />
        </section>

        <RankProgressCard
          starter={derived.starter}
          nextRankName={derived.nextRank.name}
          onRulesClick={() => setInfoMessage("Starter requires 6 direct referrals and an active package. Builder and above use direct 3X/4X achiever rules.")}
        />

        <LegDetailsCard legs={rankProgress.legDetails || []} />
        <RankStructureCard currentRankName={rankProgress.rank.name} />

        {rankProgress.achieverBonus && (
          <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-[#C8103E]" />
              <h2 className="text-xl font-black text-[#0F172A]">Achiever Bonus — This Month</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["3x Directs", rankProgress.achieverBonus.direct3X, "(incl. 4x)"],
                ["4x Directs", rankProgress.achieverBonus.direct4X, "counts double"],
                ["Base Required", rankProgress.achieverBonus.base3X, "minimum base"],
                ["Projected Bonus", formatCurrency(rankProgress.achieverBonus.projectedBonus), "added to salary"],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
                  <p className="mt-2 break-words text-2xl font-black text-[#0F172A]">{value}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{sub}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <BottomRulesGrid currentMultiplier={rankProgress.performanceRank.salary > 0 ? 3 : 2.5} />

        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-[#ECFDF5] px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:px-5">
          <Crown className="h-8 w-8 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-lg font-black text-emerald-700">Leadership grows through consistent monthly qualification.</p>
            <p className="mt-1 text-sm text-emerald-800/80">Build active teams, maintain momentum, and unlock higher salary ranks.</p>
          </div>
          <Sparkles className="ml-auto hidden h-6 w-6 text-emerald-600 sm:block" />
          <TrendingUp className="hidden h-6 w-6 text-[#C8103E] sm:block" />
          <Users className="hidden h-6 w-6 text-violet-500 sm:block" />
          <Wallet className="hidden h-6 w-6 text-amber-500 sm:block" />
        </section>
      </div>
    </main>
  );
};

export default SalaryPage;
