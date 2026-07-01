"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getRewards,
  getRewardPrograms,
  transferReward,
  getTransferRecipients,
  getKycStatus,
  getActiveLegsCount,
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
  Ship,
  Plane,
  ChevronDown,
  Users,
  Crown,
  ClipboardList,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppLoadingScreen from "@/app/components/auth/AppLoadingScreen";
import { RewardDocumentModal } from "@/app/components/rewards/RewardDocumentModal";
import GamifiedRewardsSection from "@/app/components/rewards/gamified/GamifiedRewardsSection";
import LuxuryTierRulesPanel from "@/app/components/rewards/LuxuryTierRulesPanel";

// ─── Constants ───────────────────────────────────────────────────────────────

const TRAVEL_SHOWCASE_IDS = ["europe-trip-2026", "cruise-trip-2026"];

const TRAVEL_PROMO: Record<
  string,
  {
    title: string;
    subtitle: string;
    image: string;
    icon: React.ReactNode;
  }
> = {
  "europe-trip-2026": {
    title: "Europe Trip 2026",
    subtitle: "Paris, Amsterdam, Zurich, Rome and Switzerland",
    image: "/rewards/europe-trip-bg.png",
    icon: <Plane className="h-5 w-5" />,
  },
  "cruise-trip-2026": {
    title: "Cruise Trip 2026",
    subtitle: "Vizag to Pondicherry to Chennai",
    image: "/rewards/cruise-trip-bg.png",
    icon: <Ship className="h-5 w-5" />,
  },
};

const PROGRAM_ICONS: Record<string, React.ReactNode> = {
  "europe-trip-2026": <Plane className="w-5 h-5" />,
  "cruise-trip-2026": <Ship className="w-5 h-5" />,
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

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

type ClaimStatus =
  | "NONE"
  | "PENDING"
  | "COMPLETED"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENTS_PENDING";

type RewardStatusInfo = {
  label: string;
  tone: "success" | "warning" | "waiting" | "locked" | "neutral";
  needsAction: boolean;
};

function getRewardStatusInfo(reward: Reward, isProgramLocked: boolean): RewardStatusInfo {
  if (isProgramLocked && reward.claimStatus === "NONE" && !reward.isTransferred) {
    return { label: "Closed", tone: "locked", needsAction: false };
  }
  switch (reward.claimStatus as ClaimStatus) {
    case "COMPLETED":
      return { label: "You got it", tone: "success", needsAction: false };
    case "PENDING":
      return { label: "Waiting for review", tone: "waiting", needsAction: false };
    case "DOCUMENTS_REQUIRED":
      return { label: "Action needed", tone: "warning", needsAction: true };
    case "DOCUMENTS_PENDING":
      return { label: "Waiting for review", tone: "waiting", needsAction: false };
    case "NONE":
      if (reward.isTransferred) {
        return { label: "Given to someone else", tone: "neutral", needsAction: false };
      }
      if (reward.isEligible) {
        return { label: "Waiting for review", tone: "waiting", needsAction: false };
      }
      return { label: "Locked", tone: "locked", needsAction: false };
    default:
      return { label: "In progress", tone: "neutral", needsAction: false };
  }
}

const statusToneClass: Record<RewardStatusInfo["tone"], string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  waiting: "bg-blue-50 text-blue-700",
  locked: "bg-slate-100 text-slate-500",
  neutral: "bg-slate-100 text-slate-600",
};

function countClaimsPending(rewards: Reward[], programs: Record<string, RewardProgram>) {
  return rewards.filter((reward) => {
    const locked = programs[reward.programId]?.status === "locked";
    const status = getRewardStatusInfo(reward, locked);
    return (
      status.tone === "warning" ||
      status.tone === "waiting" ||
      (reward.isEligible && reward.claimStatus === "NONE")
    );
  }).length;
}

function findHeroReward(rewards: Reward[]): Reward | null {
  const action =
    rewards.find((r) => r.claimStatus === "DOCUMENTS_REQUIRED") ??
    rewards.find(
      (r) =>
        r.claimStatus === "DOCUMENTS_PENDING" ||
        r.claimStatus === "PENDING" ||
        (r.isEligible && r.claimStatus === "NONE"),
    );
  if (action) return action;

  const inProgress = rewards.filter((r) => r.claimStatus !== "COMPLETED" && !r.isTransferred);
  if (!inProgress.length) return null;

  return inProgress.reduce((best, r) => {
    const p = r.rewardSnapshot.valueUSD > 0 ? r.currentValueUSD / r.rewardSnapshot.valueUSD : 0;
    const bp = best.rewardSnapshot.valueUSD > 0 ? best.currentValueUSD / best.rewardSnapshot.valueUSD : 0;
    return p > bp ? r : best;
  }, inProgress[0]);
}

// ─── Closest reward hero ─────────────────────────────────────────────────────

const ClosestRewardHero = ({
  reward,
  programName,
  promoImage,
  isProgramLocked,
  onUploadDocuments,
  onViewDetails,
}: {
  reward: Reward | null;
  programName: string;
  promoImage?: string;
  isProgramLocked: boolean;
  onUploadDocuments: (reward: Reward) => void;
  onViewDetails: () => void;
}) => {
  if (!reward) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-bold text-[#64748B]">Next trip reward</p>
        <h2 className="mt-2 text-2xl font-black text-[#0F172A]">No active travel rewards yet</h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Keep building your sales and team to unlock travel rewards.
        </p>
      </section>
    );
  }

  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = Math.min(total > 0 ? (current / total) * 100 : 0, 100);
  const status = getRewardStatusInfo(reward, isProgramLocked);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {promoImage && (
        <div className="relative h-36 w-full bg-slate-100 sm:h-44 lg:h-52">
          <Image src={promoImage} alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-bold text-white/80">Next trip reward</p>
            <h2 className="text-xl font-black text-white sm:text-2xl">{programName}</h2>
          </div>
        </div>
      )}
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            {!promoImage && (
              <>
                <p className="text-xs font-bold text-[#64748B]">Next trip reward</p>
                <h2 className="mt-1 text-2xl font-black text-[#0F172A] lg:text-3xl">{programName}</h2>
              </>
            )}
            <p className={`font-bold text-[#0F172A] lg:text-lg ${promoImage ? "text-base" : "mt-2 text-base"}`}>
              {reward.rewardSnapshot.reward}
            </p>
          </div>

          <div className="mt-4 w-full lg:mt-0 lg:max-w-sm lg:shrink-0">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[#64748B]">{Math.round(progress)}% complete</span>
              <span className="font-black text-[#0F172A]">
                {formatCurrency(current)} / {formatCurrency(total)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#00b386]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 lg:mt-6">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusToneClass[status.tone]}`}>
            {status.label}
          </span>
          {status.needsAction && reward.claimStatus === "DOCUMENTS_REQUIRED" && (
            <Button
              onClick={() => onUploadDocuments(reward)}
              className="rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#ad1b34]"
            >
              <FileClock className="mr-2 h-4 w-4" />
              Send documents
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onViewDetails}
            className="rounded-xl border-slate-200 font-bold"
          >
            View details
          </Button>
        </div>
      </div>
    </section>
  );
};

// ─── Quick status tiles ──────────────────────────────────────────────────────

const QuickStatusTiles = ({
  yourSales,
  teamSales,
  activeTeams,
  claimsPending,
}: {
  yourSales: ReturnType<typeof getRewardProgress>;
  teamSales: ReturnType<typeof getRewardProgress>;
  activeTeams: number;
  claimsPending: number;
}) => {
  const tiles = [
    {
      label: "Your sales",
      value: formatCurrency(yourSales.current),
      sub: `${yourSales.percent}% to next`,
      icon: Gift,
      color: "#00b386",
    },
    {
      label: "Team sales",
      value: formatCurrency(teamSales.current),
      sub: `${teamSales.percent}% to next`,
      icon: Users,
      color: "#C41E3A",
    },
    {
      label: "Active teams",
      value: activeTeams.toString(),
      sub: "This cycle",
      icon: Crown,
      color: "#7C3AED",
    },
    {
      label: "Claims pending",
      value: claimsPending.toString(),
      sub: claimsPending === 0 ? "All clear" : "Needs attention",
      icon: ClipboardList,
      color: "#D97706",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-1 xl:gap-4">
      {tiles.map(({ label, value, sub, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-5"
        >
          <Icon className="h-5 w-5 lg:h-6 lg:w-6" style={{ color }} />
          <p className="mt-3 text-xs font-bold text-[#64748B]">{label}</p>
          <p className="mt-1 truncate text-lg font-black text-[#0F172A] sm:text-xl">{value}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#94A3B8] lg:text-xs">{sub}</p>
        </div>
      ))}
    </section>
  );
};

// ─── All rewards grid ────────────────────────────────────────────────────────

const TravelRewardTile = ({
  program,
  progress,
  rewards,
  onSelect,
}: {
  program: RewardProgram;
  progress: ReturnType<typeof getRewardProgress>;
  rewards: Reward[];
  onSelect: () => void;
}) => {
  const promo = TRAVEL_PROMO[program.programId];
  if (!promo) return null;

  const isLocked = program.status === "locked";
  const bestReward = findHeroReward(rewards);
  const status = bestReward
    ? getRewardStatusInfo(bestReward, isLocked)
    : { label: isLocked ? "Closed" : "In progress", tone: isLocked ? "locked" as const : "neutral" as const };

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
    >
      <div className="relative h-24 bg-slate-100 sm:h-28 lg:h-32">
        <Image src={promo.image} alt="" fill className="object-cover" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-[#C41E3A]">
          {promo.icon}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusToneClass[status.tone]}`}
        >
          {status.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-base font-black text-[#0F172A]">{promo.title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-[#64748B]">{promo.subtitle}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#00b386]"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-black text-[#0F172A]">{progress.percent}%</p>
      </div>
    </button>
  );
};

// ─── Today tasks ─────────────────────────────────────────────────────────────

type TodayTask = {
  id: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
};

const TodayDoThis = ({ tasks }: { tasks: TodayTask[] }) => {
  if (!tasks.length) {
    return (
      <section className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="text-sm font-black text-emerald-800">All caught up</p>
            <p className="text-sm text-emerald-700">No urgent reward tasks for today.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Today — do this</p>
      <ul className="mt-4 space-y-3">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-col gap-3 rounded-2xl bg-[#F8FAFC] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#C41E3A]" />
              <p className="text-sm font-semibold text-[#0F172A]">{task.text}</p>
            </div>
            <Button
              type="button"
              onClick={task.onAction}
              className="shrink-0 rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#ad1b34] sm:px-5"
            >
              {task.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
};

// ─── Reward card (details section) ───────────────────────────────────────────

const RewardCard = ({
  reward,
  onTransfer,
  onUploadDocuments,
  isProgramLocked,
}: {
  reward: Reward;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
  isProgramLocked: boolean;
}) => {
  const wasReceived = !!reward.transferredFrom;
  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = wasReceived
    ? 100
    : Math.min(total > 0 ? (current / total) * 100 : 0, 100);
  const status = getRewardStatusInfo(reward, isProgramLocked);
  const canTransferReward = !reward.isTransferred && !wasReceived && !isProgramLocked;

  const renderAction = () => {
    if (isProgramLocked && reward.claimStatus === "NONE" && !reward.isTransferred) {
      return (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-500">
          <Lock className="h-5 w-5" />
          Closed
        </div>
      );
    }

    switch (reward.claimStatus as ClaimStatus) {
      case "COMPLETED":
        return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            <CheckCircle className="h-5 w-5" />
            You got it
          </div>
        );
      case "PENDING":
      case "DOCUMENTS_PENDING":
        return (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
            <FileCheck className="h-5 w-5" />
            Waiting for review
          </div>
        );
      case "DOCUMENTS_REQUIRED":
        return (
          <Button
            onClick={() => onUploadDocuments(reward)}
            className="w-full rounded-xl bg-[#C41E3A] font-semibold text-white hover:bg-[#ad1b34]"
            disabled={isProgramLocked}
          >
            <FileClock className="mr-2 h-4 w-4" />
            Send documents
          </Button>
        );
      case "NONE":
        if (reward.isTransferred) {
          return (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-500">
              <Send className="h-5 w-5" />
              Given to someone else
            </div>
          );
        }
        if (reward.isEligible) {
          return (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Waiting for review
            </div>
          );
        }
        return (
          <div className="rounded-xl bg-slate-50 p-3 text-center text-sm text-[#64748B]">
            Keep working to unlock this reward
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-black text-[#0F172A] sm:text-lg">
            {reward.rewardSnapshot.reward}
          </CardTitle>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              reward.type === "self" ? "bg-emerald-50 text-emerald-700" : "bg-[#FFF1F4] text-[#C41E3A]"
            }`}
          >
            {reward.type === "self" ? "Your sales" : "Team sales"}
          </span>
        </div>
        <p className="pt-1 text-sm text-[#64748B]">Goal: {formatCurrency(total)}</p>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col justify-between space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[#64748B]">Progress</span>
            <span className="font-bold text-[#0F172A]">
              {formatCurrency(current)} / {formatCurrency(total)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusToneClass[status.tone]}`}>
            {status.label}
          </span>
        </div>

        {wasReceived && (
          <div className="flex items-center gap-2 rounded-xl bg-cyan-50 p-2 text-sm text-cyan-700">
            <Info className="h-4 w-4" />
            <span>Received from {reward.transferredFrom ?? "another member"}.</span>
          </div>
        )}

        <div className="mt-auto space-y-2 pt-2">
          {renderAction()}
          {canTransferReward && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onTransfer(reward)}
              className="w-full rounded-xl border-slate-200 font-bold text-[#0F172A] hover:bg-slate-50"
            >
              <Send className="mr-2 h-4 w-4 text-[#C41E3A]" />
              Give to someone else
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Transfer modal ──────────────────────────────────────────────────────────

const TransferModal = ({
  reward,
  onClose,
  onConfirm,
}: {
  reward: Reward;
  onClose: () => void;
  onConfirm: (rewardId: string, recipientId: string) => Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || (selectedRecipient && searchQuery.startsWith(selectedRecipient.fullName))) {
      setFilteredRecipients([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const data = await getTransferRecipients(false, q, 20);
      if (cancelled) return;
      if (data && !("error" in data)) {
        setFilteredRecipients(data as Recipient[]);
      } else {
        setFilteredRecipients([]);
      }
      setIsSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedRecipient]);

  const handleConfirm = async () => {
    if (!selectedRecipient) return;
    setIsTransferring(true);
    await onConfirm(reward._id, selectedRecipient.userId);
    setIsTransferring(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-xl font-black text-[#0F172A]">Give reward to someone else</h3>
        <p className="mb-6 text-sm text-[#64748B]">
          You are giving away{" "}
          <span className="font-semibold text-[#C41E3A]">{reward.rewardSnapshot.reward}</span>.
          This cannot be undone.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="recipient-search" className="mb-1 block text-sm font-medium text-[#0F172A]">
              Find member by name or ID
            </label>
            <input
              id="recipient-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedRecipient(null);
              }}
              placeholder="Type a name..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
            {isSearching ? (
              <p className="p-3 text-[#64748B]">Searching…</p>
            ) : filteredRecipients.length > 0 ? (
              filteredRecipients.map((r) => (
                <button
                  type="button"
                  key={r.userId}
                  onClick={() => {
                    setSelectedRecipient(r);
                    setSearchQuery(`${r.fullName} (${r.userId})`);
                  }}
                  className={`w-full cursor-pointer p-3 text-left hover:bg-slate-50 ${
                    selectedRecipient?.userId === r.userId ? "bg-emerald-50" : ""
                  }`}
                >
                  <p className="font-semibold text-[#0F172A]">{r.fullName}</p>
                  <p className="text-sm text-[#64748B]">{r.userId}</p>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <p className="p-3 text-[#64748B]">No members found.</p>
            ) : (
              <p className="p-3 text-[#64748B]">Type a name to search.</p>
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
            className="bg-[#C41E3A] text-white hover:bg-[#ad1b34]"
          >
            {isTransferring ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Program tracker (details) ───────────────────────────────────────────────

const ProgramTracker = ({
  program,
  rewards,
  onTransfer,
  onUploadDocuments,
}: {
  program: RewardProgram;
  rewards: Reward[];
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
}) => {
  const [activeType, setActiveType] = useState<"self" | "team">("self");
  const selfRewards = rewards.filter((r) => r.type === "self");
  const teamRewards = rewards.filter((r) => r.type === "team");
  const isLocked = program.status === "locked";
  const displayRewards = activeType === "self" ? selfRewards : teamRewards;

  return (
    <section
      id={`tracker-${program.programId}`}
      className="scroll-mt-8 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C81E4A]">
            {PROGRAM_ICONS[program.programId] ?? <Gift className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-xs font-bold text-[#64748B]">Travel reward</p>
            <h2 className="text-lg font-black text-[#0F172A] sm:text-xl">{program.name}</h2>
          </div>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${
            isLocked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isLocked ? "Closed" : "Active"}
        </span>
      </div>

      {(selfRewards.length > 0 || teamRewards.length > 0) && (
        <div className="mb-4 flex w-full rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-fit">
          {selfRewards.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveType("self")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
                activeType === "self"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Your sales
            </button>
          )}
          {teamRewards.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveType("team")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
                activeType === "team"
                  ? "bg-white text-[#C41E3A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Team sales
            </button>
          )}
        </div>
      )}

      {displayRewards.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {displayRewards.map((reward) => (
              <RewardCard
                key={reward._id}
                reward={reward}
                onTransfer={onTransfer}
                onUploadDocuments={onUploadDocuments}
                isProgramLocked={isLocked}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="py-4 text-sm text-[#64748B]">No rewards in this group yet.</p>
      )}
    </section>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const RewardsPage = () => {
  const router = useRouter();
  const detailsRef = useRef<HTMLDivElement>(null);

  const [rewardsByProgram, setRewardsByProgram] = useState<Record<string, Reward[]>>({});
  const [programConfigs, setProgramConfigs] = useState<Record<string, RewardProgram>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [transferModalReward, setTransferModalReward] = useState<Reward | null>(null);
  const [uploadModalReward, setUploadModalReward] = useState<Reward | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [activeLegs, setActiveLegs] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const activePrograms = TRAVEL_SHOWCASE_IDS.map((id) => programConfigs[id]).filter(
    (p): p is RewardProgram => !!p && p.status === "active",
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
      const [rewardsData, programsData, kycData, activeLegsResp] = await Promise.all([
        getRewards(),
        getRewardPrograms(),
        getKycStatus(),
        getActiveLegsCount(),
      ]);

      if (activeLegsResp && !("error" in activeLegsResp)) {
        setActiveLegs(activeLegsResp.count ?? 0);
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
        const visibleRewards = allRewards.filter(
          (reward) =>
            TRAVEL_SHOWCASE_IDS.includes(reward.programId) &&
            configs[reward.programId]?.status === "active",
        );
        const grouped = visibleRewards.reduce(
          (acc, reward) => {
            if (!acc[reward.programId]) acc[reward.programId] = [];
            acc[reward.programId].push(reward);
            return acc;
          },
          {} as Record<string, Reward[]>,
        );
        setRewardsByProgram(grouped);
      }
    } catch (e) {
      setError("Something went wrong while loading your rewards.");
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openClaimsFromHash = () => {
      if (window.location.hash === "#reward-claims") {
        setShowDetails(true);
      }
    };
    openClaimsFromHash();
    window.addEventListener("hashchange", openClaimsFromHash);
    return () => window.removeEventListener("hashchange", openClaimsFromHash);
  }, []);

  const handleTransferReward = async (rewardId: string, recipientId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await transferReward(rewardId, recipientId);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMessage((result as { message: string }).message ?? "Reward transferred.");
        setTransferModalReward(null);
        fetchInitialData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed. Please try again.");
    }
  };

  const handleRewardUpdate = (updatedReward: Reward) => {
    setUploadModalReward(updatedReward);
    setRewardsByProgram((prev) => {
      const updated = { ...prev };
      const program = updated[updatedReward.programId];
      if (program) {
        const index = program.findIndex((r) => r._id === updatedReward._id);
        if (index !== -1) program[index] = updatedReward;
      }
      return updated;
    });
  };

  const scrollToDetails = useCallback((programId?: string) => {
    setShowDetails(true);
    requestAnimationFrame(() => {
      if (programId) {
        document.getElementById(`tracker-${programId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const allVisibleRewards = useMemo(
    () => Object.values(rewardsByProgram).flat(),
    [rewardsByProgram],
  );
  const yourSales = useMemo(
    () => getRewardProgress(allVisibleRewards.filter((r) => r.type === "self")),
    [allVisibleRewards],
  );
  const teamSales = useMemo(
    () => getRewardProgress(allVisibleRewards.filter((r) => r.type === "team")),
    [allVisibleRewards],
  );
  const claimsPending = useMemo(
    () => countClaimsPending(allVisibleRewards, programConfigs),
    [allVisibleRewards, programConfigs],
  );
  const heroReward = useMemo(() => findHeroReward(allVisibleRewards), [allVisibleRewards]);

  const heroProgram = heroReward
    ? displayPrograms.find((p) => p.programId === heroReward.programId) ??
      ({ programId: heroReward.programId, name: TRAVEL_PROMO[heroReward.programId]?.title ?? "Reward" } as RewardProgram)
    : null;

  const todayTasks = useMemo(() => {
    const tasks: TodayTask[] = [];

    if (kycStatus?.status !== "VERIFIED") {
      tasks.push({
        id: "kyc",
        text: "Complete your ID verification to claim rewards",
        actionLabel: "Start",
        onAction: () => router.push("/kyc"),
      });
    }

    allVisibleRewards
      .filter((r) => r.claimStatus === "DOCUMENTS_REQUIRED")
      .forEach((r) => {
        tasks.push({
          id: `docs-${r._id}`,
          text: `Send documents for ${r.rewardSnapshot.reward}`,
          actionLabel: "Send documents",
          onAction: () => setUploadModalReward(r),
        });
      });

    if (heroReward && heroReward.claimStatus === "NONE" && !heroReward.isEligible) {
      const remaining = Math.max(0, (heroReward.rewardSnapshot.valueUSD ?? 0) - (heroReward.currentValueUSD ?? 0));
      if (remaining > 0) {
        tasks.push({
          id: "sales-gap",
          text: `Get ${formatCurrency(remaining)} more sales for ${heroReward.rewardSnapshot.reward}`,
          actionLabel: "View team",
          onAction: () => router.push("/team"),
        });
      }
    }

    return tasks.slice(0, 3);
  }, [allVisibleRewards, heroReward, kycStatus, router]);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (dataLoading) {
    return <AppLoadingScreen message="Loading rewards…" fullScreen={false} />;
  }

  return (
    <>
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
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

          <div id="luxury-rewards" className="scroll-mt-4">
            <GamifiedRewardsSection
              dateLabel={todayLabel}
              stats={{
                yourSales: formatCurrency(yourSales.current),
                teamSales: formatCurrency(teamSales.current),
                activeLegs,
              }}
            />
          </div>

          <section id="reward-claims" ref={detailsRef} className="scroll-mt-6">
            <button
              type="button"
              onClick={() => setShowDetails((open) => !open)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-black text-[#0F172A]">Rules & claim details</p>
                <p className="text-xs text-[#64748B]">How rewards work, upload documents, transfer</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-[#64748B] transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4 sm:space-y-6">
                <LuxuryTierRulesPanel />
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <p className="text-xs font-bold text-[#64748B]">My claims</p>
                    <h2 className="mt-1 text-xl font-black text-[#0F172A]">Travel reward details</h2>
                    <p className="mt-1 text-sm text-[#64748B]">
                      Upload documents, check status, or give a reward to another member.
                    </p>
                  </div>
                  {displayPrograms.map((program) => (
                    <ProgramTracker
                      key={program.programId}
                      program={program}
                      rewards={rewardsByProgram[program.programId] ?? []}
                      onTransfer={setTransferModalReward}
                      onUploadDocuments={setUploadModalReward}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {transferModalReward && (
          <TransferModal
            reward={transferModalReward}
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
