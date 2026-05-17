"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getRewards,
  getRewardPrograms,
  transferReward,
  getTransferRecipients,
  getProfileData,
  getKycStatus,
  getDashboardData,
  getLeaderboard,
  getReferralSummary,
} from "@/actions/user";
import { Reward, Recipient, KycStatus, RewardProgram } from "@/types";
import {
  CheckCircle,
  Loader2,
  Gift,
  Send,
  Info,
  FileClock,
  FileCheck,
  Lock,
  Calendar,
  Check,
  ChevronRight,
  Crown,
  Clock,
  Medal,
  Ship,
  Plane,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RewardDocumentModal } from "@/app/components/rewards/RewardDocumentModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const TRAVEL_SHOWCASE_IDS = ["europe-trip-2026", "cruise-trip-2026"];

const TRAVEL_PROMO: Record<
  string,
  {
    title: string;
    subtitle: string;
    image: string;
    lastDate: string;
    cta: string;
    details: { label: string; value: string }[];
  }
> = {
  "europe-trip-2026": {
    title: "Europe Trip 2026",
    subtitle: "Paris, Amsterdam, Zurich, Rome and Switzerland",
    image: "/rewards/europe-trip-bg.png",
    cta: "View Progress",
    lastDate: "April 10",
    details: [
      { label: "Destinations", value: "Paris, Amsterdam, Zurich, Rome, Switzerland" },
      { label: "Single Ticket", value: "₹20 Lakhs business" },
      { label: "Family Trip", value: "₹30 Lakhs business" },
    ],
  },
  "cruise-trip-2026": {
    title: "Cruise Trip 2026",
    subtitle: "Vizag to Pondicherry to Chennai",
    image: "/rewards/cruise-trip-bg.png",
    cta: "View Progress",
    lastDate: "April 10",
    details: [
      { label: "Travel Dates", value: "8th July to 11th July" },
      { label: "Duration", value: "3 Nights / 4 Days" },
      { label: "Route", value: "Vizag → Pondicherry → Chennai" },
      { label: "Qualification", value: "3 Lakhs business (Single Ticket)" },
    ],
  },
};

const PROGRAM_ICONS: Record<string, React.ReactNode> = {
  "europe-trip-2026": <Plane className="w-5 h-5" />,
  "cruise-trip-2026": <Ship className="w-5 h-5" />,
};

const REWARD_ASSETS = {
  hero: "/rewards/hero-travel-collage.png",
  trophy: "/rewards/trophy-motivation.png",
  global: "/rewards/global-rewards-collage.png",
  tech: "/rewards/luxury-tech-reward.png",
  bike: "/rewards/bike-travel-reward.png",
  officeCar: "/rewards/office-car-reward.png",
  crown: "/rewards/crown-tier-reward.png",
} as const;

const tierCards = [
  {
    name: "Starter Tier",
    threshold: "₹10,00,000",
    image: "/rewards/luxury-tech-reward.png",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    accent: "from-amber-50 to-white",
    rewards: ["Choose Any One", "Dubai Trip / MacBook", "iPad / ₹1L Cash"],
  },
  {
    name: "Mid Tier",
    threshold: "₹30,00,000",
    image: "/rewards/bike-travel-reward.png",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    accent: "from-emerald-50 to-white",
    rewards: ["Choose Any One", "Premium Bike / Intl Trip", "₹3L Cash"],
  },
  {
    name: "Elite Tier",
    threshold: "₹50,00,000",
    image: "/rewards/office-car-reward.png",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-600",
    accent: "from-sky-50 to-white",
    rewards: ["Choose Any One", "Office Setup / Car", "₹6L Cash"],
  },
  {
    name: "Crown Tier",
    threshold: "₹1,00,00,000",
    image: "/rewards/crown-tier-reward.png",
    badgeBg: "bg-rose-50",
    badgeText: "text-[#C81E4A]",
    accent: "from-[#FFF7ED] to-[#FFF1F4]",
    rewards: ["Choose Any One", "House / Luxury Car", "₹10L+ Cash"],
  },
];

const benefitItems = [
  { icon: Trophy, label: "Performance Based Rewards" },
  { icon: ShieldCheck, label: "Fair & Transparent" },
  { icon: TrendingUp, label: "Carry Forward Eligible Volume" },
  { icon: Zap, label: "Active & Sustainable System" },
  { icon: Sparkles, label: "Reward Your Success" },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const maskName = (value: string) => {
  const clean = value.trim();
  if (clean.length <= 2) return clean;
  return `${clean.charAt(0)}${"*".repeat(Math.min(5, Math.max(2, clean.length - 2)))}${clean.charAt(clean.length - 1)}`;
};

const getRewardProgress = (rewards: Reward[]) => {
  if (!rewards.length) return { current: 0, target: 0, percent: 0 };
  const best = rewards.reduce((chosen, reward) => {
    const chosenProgress =
      chosen.rewardSnapshot.valueUSD > 0
        ? chosen.currentValueUSD / chosen.rewardSnapshot.valueUSD
        : 0;
    const progress =
      reward.rewardSnapshot.valueUSD > 0
        ? reward.currentValueUSD / reward.rewardSnapshot.valueUSD
        : 0;
    return progress > chosenProgress ? reward : chosen;
  }, rewards[0]);
  const target = best.rewardSnapshot.valueUSD ?? 0;
  const current = best.currentValueUSD ?? 0;
  return {
    current,
    target,
    percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
  };
};

const ProgressRing = ({ percent, label }: { percent: number; label?: string }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-xl font-black">{percent}%</span>
        {label && <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">{label}</span>}
      </div>
    </div>
  );
};

// ─── Showcase Card ───────────────────────────────────────────────────────────

const ShowcaseCard = ({ program, rewards }: { program: RewardProgram; rewards: Reward[] }) => {
  const promo = TRAVEL_PROMO[program.programId];
  const progress = getRewardProgress(rewards);

  if (!promo) return null;

  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="rewards-dark-surface group relative min-h-[430px] overflow-hidden rounded-3xl border border-white/20 text-left shadow-[0_18px_45px_rgba(15,23,42,0.16)] focus:outline-none focus:ring-2 focus:ring-[#C81E4A]/30"
      onClick={() => {
        document
          .getElementById(`tracker-${program.programId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      <Image
        src={promo.image}
        alt={promo.title}
        fill
        className="object-cover transition duration-700 group-hover:scale-105"
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#12020A]/95 via-[#300615]/62 to-black/18" />
      <div className="relative flex h-full min-h-[430px] flex-col justify-between p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black uppercase tracking-[0.1em] text-white backdrop-blur">
            {PROGRAM_ICONS[program.programId] ?? <Gift className="h-4 w-4" />}
            {program.status}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            <Calendar className="h-3.5 w-3.5" />
            Last Date: {promo.lastDate}
          </span>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-200">
                {promo.subtitle}
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                {program.name || promo.title}
              </h3>
            </div>
            <ProgressRing percent={progress.percent} label="done" />
          </div>
          <div className="grid gap-2">
            {promo.details.map((d) => (
              <div key={d.label} className="rounded-2xl border border-white/12 bg-white/12 px-4 py-3 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/58">
                  {d.label}
                </p>
                <p className="mt-1 text-sm font-bold text-white">{d.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#C81E4A] px-5 py-3 text-sm font-black text-white shadow-[0_8px_20px_rgba(200,30,74,0.45)] ring-1 ring-white/20 transition group-hover:bg-[#A8163C]">
            {promo.cta}
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ─── Reward Tracker Card ─────────────────────────────────────────────────────

type ClaimStatus =
  | "NONE"
  | "PENDING"
  | "COMPLETED"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENTS_PENDING";

const RewardCard = ({
  reward,
  onTransfer,
  onUploadDocuments,
  recipients,
  kycStatus,
  isProgramLocked,
}: {
  reward: Reward;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
  recipients: Recipient[];
  kycStatus: KycStatus | null;
  isProgramLocked: boolean;
}) => {
  const wasReceived = !!reward.transferredFrom;

  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = wasReceived
    ? 100
    : Math.min(total > 0 ? (current / total) * 100 : 0, 100);

  const sender = reward.transferredFrom
    ? recipients.find((r) => r.userId === reward.transferredFrom)
    : null;

  const showTransferredStatus = reward.isTransferred;
  const canTransferReward = recipients.length > 0 && !reward.isTransferred && !wasReceived && !isProgramLocked;
  const kycLabel = kycStatus?.status === "VERIFIED" ? "KYC verified" : "KYC status pending";

  const renderStatus = () => {
    if (isProgramLocked && reward.claimStatus === "NONE" && !reward.isTransferred) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 font-semibold text-slate-500">
          <Lock className="w-5 h-5" />
          Program Ended
        </div>
      );
    }

    switch (reward.claimStatus as ClaimStatus) {
      case "COMPLETED":
        return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-700">
            <CheckCircle className="w-5 h-5" />
            Claimed Successfully
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 font-semibold text-amber-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            Pending Admin Approval
          </div>
        );
      case "DOCUMENTS_REQUIRED":
        return (
          <Button
            onClick={() => onUploadDocuments(reward)}
            className="wallet-red-control w-full rounded-xl bg-[#C81E4A] font-semibold text-white hover:bg-[#A90D32]"
            disabled={isProgramLocked}
          >
            <FileClock className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        );
      case "DOCUMENTS_PENDING":
        return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-purple-50 p-3 font-semibold text-purple-700">
            <FileCheck className="w-5 h-5" />
            Documents Pending Review
          </div>
        );
      case "NONE":
        if (showTransferredStatus) {
          return (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 font-semibold text-slate-500">
              <Send className="w-5 h-5" />
              Transferred
            </div>
          );
        }
        if (reward.isEligible) {
          return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 font-semibold text-amber-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              Pending Admin Approval
            </div>
          );
        }
        return (
          <div className="rounded-xl bg-slate-50 p-3 text-center text-sm text-[#64748B]">
            Keep going to unlock this reward!
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-[#0F172A]">
            {reward.rewardSnapshot.reward}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              reward.type === "self"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#FFF1F4] text-[#C81E4A]"
            }`}
          >
            {reward.type} Business
          </span>
        </div>
        <p className="flex items-center gap-2 pt-1 text-[#64748B]">
          <Gift className="w-4 h-4 text-emerald-500" />
          Target: ₹{reward.rewardSnapshot.valueUSD.toLocaleString('en-IN')}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-[#64748B]">Progress</span>
            <span className="font-semibold text-[#0F172A]">
              ₹{current.toLocaleString('en-IN')} / ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {wasReceived && (
          <div className="flex items-center gap-2 rounded-xl bg-cyan-50 p-2 text-sm text-cyan-700">
            <Info className="w-4 h-4" />
            <span>
              Received from {sender ? sender.fullName : "another user"}.
            </span>
          </div>
        )}

        <div className="mt-auto space-y-3 pt-4">
          {renderStatus()}
          {canTransferReward && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onTransfer(reward)}
              aria-label={`Transfer reward, ${kycLabel}`}
              className="w-full rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
            >
              <Send className="mr-2 h-4 w-4 text-[#C81E4A]" />
              Transfer Reward
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RewardsHeader = ({ onRulesClick }: { onRulesClick: () => void }) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
        Rewards <span aria-hidden="true">🏆</span>
      </h1>
      <p className="mt-1 text-sm text-[#64748B] sm:text-base">
        Unlock amazing travel experiences and luxury rewards.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        onClick={onRulesClick}
        className="h-12 rounded-xl border-slate-200 bg-white px-4 font-bold text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50"
      >
        <Info className="mr-2 h-4 w-4 text-[#C81E4A]" />
        Rules & Info
      </Button>
    </div>
  </header>
);

const RewardsHeroBanner = ({
  directProgress,
  teamProgress,
}: {
  directProgress: ReturnType<typeof getRewardProgress>;
  teamProgress: ReturnType<typeof getRewardProgress>;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="rewards-dark-surface relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E2A2C] via-[#0A1F22] to-[#06181A] p-6 text-white shadow-[0_24px_70px_rgba(6,24,26,0.32)] sm:p-8 lg:p-10"
  >
    <Image
      src={REWARD_ASSETS.hero}
      alt="Global travel rewards collage"
      fill
      priority
      className="object-cover opacity-68"
      sizes="100vw"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F22]/95 via-[#0E2A2C]/65 to-black/30" />
    <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-100 backdrop-blur">
          <Sparkles className="h-4 w-4" />
          SAGENEX Rewards
        </span>
        <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          GLOBAL FLY REWARDS
        </h2>
        <p className="mt-4 text-lg font-semibold text-white/86">
          Achieve this month, fly next month
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Users, label: "Build Your Business" },
            { icon: Gift, label: "Unlock Rewards" },
            { icon: Plane, label: "Live Your Dreams" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-2xl border border-white/12 bg-white/12 p-4 backdrop-blur">
              <Icon className="h-5 w-5 text-amber-100" />
              <p className="mt-3 text-sm font-black text-white">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-white/16 bg-white/14 p-5 backdrop-blur-md">
        <p className="text-sm font-black uppercase tracking-[0.12em] text-white/70">
          Progress Summary
        </p>
        <div className="mt-5 space-y-5">
          {[
            { label: "Direct Business", progress: directProgress, color: "bg-emerald-400" },
            { label: "Team Business", progress: teamProgress, color: "bg-[#F59E0B]" },
          ].map(({ label, progress, color }) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-white">{label}</span>
                <span className="text-sm font-black text-white">{progress.percent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/18">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-white/70">
                {formatCurrency(progress.current)} / {progress.target ? formatCurrency(progress.target) : "Target pending"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.section>
);

const QualificationPathSection = ({
  directProgress,
  remainingForNext,
}: {
  directProgress: ReturnType<typeof getRewardProgress>;
  remainingForNext: number;
}) => (
  <section>
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:grid lg:grid-cols-[260px_1fr]">
      <div className="relative h-44 lg:h-auto">
        <Image src={REWARD_ASSETS.global} alt="Next reward preview" fill className="object-cover" sizes="(min-width: 1024px) 260px, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent lg:bg-gradient-to-r" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Next Reward Preview</p>
        <h3 className="mt-2 text-3xl font-black text-[#0F172A]">Europe Trip 2026</h3>
        <p className="mt-3 text-sm text-[#64748B]">You are just</p>
        <p className="mt-1 text-3xl font-black text-emerald-600">
          {remainingForNext > 0 ? formatCurrency(remainingForNext) : formatCurrency(directProgress.target ?? 0)}
        </p>
        <p className="text-sm font-semibold text-[#475569]">away from your dream!</p>
        <Button className="mt-6 h-11 w-full max-w-xs rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-base font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:from-emerald-700 hover:to-emerald-600">
          Keep Going 🚀
        </Button>
      </div>
    </div>
  </section>
);

const RewardTierCard = ({ tier, index }: { tier: (typeof tierCards)[number]; index: number }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className={`overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b ${tier.accent} shadow-[0_10px_30px_rgba(15,23,42,0.06)]`}
  >
    <div className="flex items-center justify-between gap-3 px-5 pt-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tier.badgeBg} text-sm font-black ${tier.badgeText}`}>{index + 1}</span>
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0F172A]">{tier.name}</p>
      </div>
      <Crown className={`h-5 w-5 ${tier.badgeText}`} />
    </div>
    <p className="mt-1 px-5 text-2xl font-black text-[#0F172A]">{tier.threshold}</p>
    <div className="relative mt-3 h-32 w-full">
      <Image src={tier.image} alt={tier.name} fill className="object-contain" sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" />
    </div>
    <div className="px-5 pb-5">
      <p className="text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">{tier.rewards[0]}</p>
      <p className="mt-2 text-center text-sm font-bold text-[#0F172A]">{tier.rewards[1]}</p>
      <p className="text-center text-sm font-bold text-[#0F172A]">{tier.rewards[2]}</p>
    </div>
  </motion.div>
);

const BenefitsStrip = () => (
  <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:grid-cols-2 lg:grid-cols-5">
    {benefitItems.map(({ icon: Icon, label }) => (
      <div key={label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0 text-[#C81E4A]" />
        <p className="text-sm font-bold text-[#0F172A]">{label}</p>
      </div>
    ))}
  </div>
);

type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  profilePicture: string | null;
  packagesSold: number;
  teamVolume: number;
  earnings: number;
};

const TopPerformersCard = ({ leaders }: { leaders: LeaderboardEntry[] }) => {
  const performers = leaders.slice(0, 4);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[#0F172A]">Top Performers This Month</h3>
      </div>
      <div className="mt-5 space-y-4">
        {performers.length > 0 ? (
          performers.map((leader) => (
            <div key={leader.userId} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 overflow-hidden">
                  {leader.profilePicture ? (
                    <Image src={leader.profilePicture} alt={leader.fullName} width={40} height={40} className="h-10 w-10 rounded-2xl object-cover" />
                  ) : (
                    <Medal className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#0F172A]">
                    {maskName(leader.fullName)}
                  </p>
                  <p className="text-xs text-[#64748B]">{leader.packagesSold} packages · Rank #{leader.rank}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-black text-emerald-600">
                +{formatCurrency(leader.teamVolume)}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-[#64748B]">
            No team activity yet this month.
          </p>
        )}
      </div>
    </div>
  );
};

const getDaysRemainingInMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const diff = Math.ceil((lastDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const getCurrentCycleLabel = () => {
  const now = new Date();
  return now.toLocaleString("en-IN", { month: "long", year: "numeric" });
};

const AchievementsCard = ({ activeLegs }: { activeLegs: number }) => {
  const requiredLegs = 5;
  const days = getDaysRemainingInMonth();
  const cycleLabel = getCurrentCycleLabel();

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <h3 className="text-lg font-black text-[#0F172A]">Achievements / Status</h3>
      <div className="mt-5 space-y-3">
        {[
          { icon: Users, label: "Active Legs", value: `${activeLegs}/${requiredLegs}` },
          { icon: Calendar, label: "Eligibility Cycle", value: cycleLabel },
          { icon: Clock, label: "Days Remaining", value: `${days} Days` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-[#C81E4A]" />
              <span className="text-sm font-bold text-[#64748B]">{label}</span>
            </div>
            <span className="text-sm font-black text-[#0F172A]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MotivationCard = () => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-[#0F172A] p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
    <Image src={REWARD_ASSETS.trophy} alt="Trophy motivation reward" fill className="object-cover opacity-58" sizes="(min-width: 1024px) 33vw, 100vw" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#0F172A]/72 to-[#0F172A]/20" />
    <div className="relative flex min-h-72 flex-col justify-end">
      <Trophy className="mb-4 h-9 w-9 text-amber-300" />
      <p className="text-2xl font-black leading-tight text-white">
        “Don’t wait for opportunity. Create it.”
      </p>
      <p className="mt-3 text-sm font-bold text-amber-100">– Sagenex SGX</p>
    </div>
  </div>
);

// ─── Transfer Modal ──────────────────────────────────────────────────────────

const TransferModal = ({
  reward,
  recipients,
  onClose,
  onConfirm,
}: {
  reward: Reward;
  recipients: Recipient[];
  onClose: () => void;
  onConfirm: (rewardId: string, recipientId: string) => Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [isTransferring, setIsTransferring] = useState(false);

  const filteredRecipients = recipients.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedRecipient) return;
    setIsTransferring(true);
    await onConfirm(reward._id, selectedRecipient.userId);
    setIsTransferring(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-xl font-black text-[#0F172A]">Transfer Reward</h3>
        <p className="mb-6 text-[#64748B]">
          You are about to transfer the reward:{" "}
          <span className="font-semibold text-emerald-600">
            {reward.rewardSnapshot.reward}
          </span>
          . This action is irreversible.
        </p>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="recipient-search"
              className="mb-1 block text-sm font-medium text-[#0F172A]"
            >
              Search Recipient by Name or ID
            </label>
            <input
              id="recipient-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedRecipient(null);
              }}
              placeholder="Start typing to search..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((r) => (
                <button
                  type="button"
                  key={r.userId}
                  onClick={() => {
                    setSelectedRecipient(r);
                    setSearchQuery(`${r.fullName} (${r.userId})`);
                  }}
                  className={`w-full cursor-pointer p-3 text-left hover:bg-slate-50 ${
                    selectedRecipient?.userId === r.userId
                      ? "bg-emerald-50"
                      : ""
                  }`}
                >
                  <p className="font-semibold text-[#0F172A]">{r.fullName}</p>
                  <p className="text-sm text-[#64748B]">{r.userId}</p>
                </button>
              ))
            ) : (
              <p className="p-3 text-[#64748B]">No matching users found.</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isTransferring || !selectedRecipient}
            className="wallet-red-control bg-[#C81E4A] text-white hover:bg-[#A90D32]"
          >
            {isTransferring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Tracker Section (per program) ───────────────────────────────────────────

const ProgramTracker = ({
  program,
  rewards,
  recipients,
  kycStatus,
  onTransfer,
  onUploadDocuments,
}: {
  program: RewardProgram;
  rewards: Reward[];
  recipients: Recipient[];
  kycStatus: KycStatus | null;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
}) => {
  const [activeType, setActiveType] = useState<"self" | "team">("self");
  const selfRewards = rewards.filter((r) => r.type === "self");
  const teamRewards = rewards.filter((r) => r.type === "team");
  const isLocked = program.status === "locked";

  const displayRewards = activeType === "self" ? selfRewards : teamRewards;

  return (
    <section id={`tracker-${program.programId}`} className="scroll-mt-8 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[#C81E4A]">
          {PROGRAM_ICONS[program.programId] ?? <Gift className="w-5 h-5" />}
        </span>
        <h2 className="text-2xl font-black text-[#0F172A]">{program.name}</h2>
        {isLocked && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Ended
          </span>
        )}
      </div>

      {/* Self / Team toggle */}
      <div className="mb-6 flex border-b border-slate-200">
        {selfRewards.length > 0 && (
          <button
            onClick={() => setActiveType("self")}
            className={`px-4 py-2 font-semibold transition-colors duration-200 ${
              activeType === "self"
                ? "border-b-2 border-emerald-500 text-emerald-700"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Self Business
          </button>
        )}
        {teamRewards.length > 0 && (
          <button
            onClick={() => setActiveType("team")}
            className={`px-4 py-2 font-semibold transition-colors duration-200 ${
              activeType === "team"
                ? "border-b-2 border-[#C81E4A] text-[#C81E4A]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Team Business
          </button>
        )}
      </div>

      {displayRewards.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayRewards.map((reward) => (
              <RewardCard
                key={reward._id}
                reward={reward}
                onTransfer={onTransfer}
                onUploadDocuments={onUploadDocuments}
                recipients={recipients}
                kycStatus={kycStatus}
                isProgramLocked={isLocked}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="py-4 text-sm text-[#64748B]">
          No rewards for this program yet.
        </p>
      )}
    </section>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const RewardsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rewardsByProgram, setRewardsByProgram] = useState<
    Record<string, Reward[]>
  >({});
  const [programConfigs, setProgramConfigs] = useState<
    Record<string, RewardProgram>
  >({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [transferModalReward, setTransferModalReward] = useState<Reward | null>(
    null
  );
  const [uploadModalReward, setUploadModalReward] = useState<Reward | null>(
    null
  );
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [activeLegs, setActiveLegs] = useState<number>(0);

  // Active travel programs from backend, filtered to showcase IDs
  const activePrograms = TRAVEL_SHOWCASE_IDS.map(
    (id) => programConfigs[id]
  ).filter(
    (p): p is RewardProgram => !!p && p.status === "active"
  );
  const displayPrograms =
    activePrograms.length > 0
      ? activePrograms
      : TRAVEL_SHOWCASE_IDS.map((id) => ({
          programId: id,
          name: TRAVEL_PROMO[id].title,
          startDate: "",
          endDate: "",
          status: "active" as const,
          selfBusinessTiers: [],
          teamBusinessTiers: [],
        }));

  const fetchInitialData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [rewardsData, programsData, recipientsData, , kycData, dashboardData, leaderboardData, summaryData] =
        await Promise.all([
          getRewards(),
          getRewardPrograms(),
          getTransferRecipients(),
          getProfileData(),
          getKycStatus(),
          getDashboardData(),
          getLeaderboard('team'),
          getReferralSummary(),
        ]);

      if (Array.isArray(leaderboardData)) {
        setLeaders(leaderboardData as LeaderboardEntry[]);
      } else if (leaderboardData && typeof leaderboardData === 'object' && 'leaderboard' in leaderboardData) {
        setLeaders((leaderboardData as { leaderboard: LeaderboardEntry[] }).leaderboard ?? []);
      }

      if (summaryData && !('error' in summaryData)) {
        const directs = (summaryData as { directs?: Array<{ activityStatus?: string }> }).directs ?? [];
        setActiveLegs(directs.filter((d) => d.activityStatus === 'Active').length);
      }

      if (kycData && "error" in kycData) setError(kycData.error as string);
      else setKycStatus(kycData as KycStatus);

      let configs: Record<string, RewardProgram> = {};
      if (programsData && "error" in programsData) {
        setError(programsData.error as string);
      } else {
        configs = (programsData as RewardProgram[]).reduce((acc, program) => {
          acc[program.programId] = program;
          return acc;
        }, {} as Record<string, RewardProgram>);
        setProgramConfigs(configs);
      }

      if (rewardsData && "error" in rewardsData) {
        setError(rewardsData.error as string);
      } else {
        const allRewards = (rewardsData || []) as Reward[];

        // Only include rewards for active travel programs
        const visibleRewards = allRewards.filter(
          (reward) =>
            TRAVEL_SHOWCASE_IDS.includes(reward.programId) &&
            configs[reward.programId]?.status === "active"
        );

        const grouped = visibleRewards.reduce((acc, reward) => {
          if (!acc[reward.programId]) acc[reward.programId] = [];
          acc[reward.programId].push(reward);
          return acc;
        }, {} as Record<string, Reward[]>);

        setRewardsByProgram(grouped);
      }

      if (recipientsData && "error" in recipientsData) {
        console.error("Could not load recipients:", recipientsData.error);
      } else {
        setRecipients(recipientsData as Recipient[]);
      }
      
      if (dashboardData?.error) console.error("Could not load dashboard data:", dashboardData.error);
    } catch (e) {
      setError("An unexpected error occurred while fetching data.");
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, authLoading, router, fetchInitialData]);

  const handleTransferReward = async (
    rewardId: string,
    recipientId: string
  ) => {
    setMessage(null);
    setError(null);
    try {
      const result = await transferReward(rewardId, recipientId);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMessage(
          (result as { message: string }).message ?? "Reward transferred."
        );
        setTransferModalReward(null);
        fetchInitialData();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during transfer."
      );
    }
  };

  const handleRewardUpdate = (updatedReward: Reward) => {
    setUploadModalReward(updatedReward);
    setRewardsByProgram((prev) => {
      const updated = { ...prev };
      const program = updated[updatedReward.programId];
      if (program) {
        const index = program.findIndex((r) => r._id === updatedReward._id);
        if (index !== -1) {
          program[index] = updatedReward;
        }
      }
      return updated;
    });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] text-[#0F172A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C81E4A]" />
      </div>
    );
  }

  const allVisibleRewards = Object.values(rewardsByProgram).flat();
  const directProgress = getRewardProgress(allVisibleRewards.filter((reward) => reward.type === "self"));
  const teamProgress = getRewardProgress(allVisibleRewards.filter((reward) => reward.type === "team"));

  return (
    <>
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7">
          <RewardsHeader onRulesClick={() => setMessage("Reward qualification rules are shown throughout this page.")} />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <RewardsHeroBanner directProgress={directProgress} teamProgress={teamProgress} />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {displayPrograms.map((program) => (
              <ShowcaseCard
                key={program.programId}
                program={program}
                rewards={rewardsByProgram[program.programId] ?? []}
              />
            ))}
          </section>

          <QualificationPathSection
            directProgress={directProgress}
            remainingForNext={Math.max(0, (directProgress.target ?? 0) - (directProgress.current ?? 0))}
          />

          <section>
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#0F172A]">Luxury Reward Tiers</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {tierCards.map((tier, index) => (
                <RewardTierCard key={tier.name} tier={tier} index={index} />
              ))}
            </div>
          </section>

          <BenefitsStrip />

          <section className="grid gap-5 lg:grid-cols-3">
            <TopPerformersCard leaders={leaders} />
            <AchievementsCard activeLegs={activeLegs} />
            <MotivationCard />
          </section>

          <div className="rounded-3xl border border-rose-100 bg-[#FFF1F4] px-5 py-4 text-center text-sm font-black text-[#C81E4A] shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            Keep building your business and unlock global experiences. Dream it. Earn it. Live it.
          </div>

          <section className="space-y-10">
            <div>
              <h2 className="text-2xl font-black text-[#0F172A]">Reward Progress Trackers</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Your backend reward progress, claims, transfers, and document actions remain here.
              </p>
            </div>
          {displayPrograms.map((program) => (
              <ProgramTracker
                key={program.programId}
                program={program}
                rewards={rewardsByProgram[program.programId] ?? []}
                recipients={recipients}
                kycStatus={kycStatus}
                onTransfer={setTransferModalReward}
                onUploadDocuments={(reward) => setUploadModalReward(reward)}
              />
            ))}
          </section>
        </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {transferModalReward && (
        <TransferModal
          reward={transferModalReward}
          recipients={recipients}
          onClose={() => setTransferModalReward(null)}
          onConfirm={handleTransferReward}
        />
      )}

      {uploadModalReward && (
        <RewardDocumentModal
          reward={uploadModalReward}
          onClose={() => setUploadModalReward(null)}
          onRewardUpdate={handleRewardUpdate}
        />
      )}
      </div>
    </>
  );
};

export default RewardsPage;
