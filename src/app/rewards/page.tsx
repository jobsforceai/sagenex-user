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
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RewardDocumentModal } from "@/app/components/rewards/RewardDocumentModal";
import LuxuryRewardsCard from "@/app/components/LuxuryRewardsCard";
import LuxuryTierRulesPanel from "@/app/components/rewards/LuxuryTierRulesPanel";

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

// REWARD_ASSETS was a catalogue of decorative imagery used by the
// MotivationCard / RewardProgramHub-luxury-tile / etc. that were stripped
// during the rewards-page cleanup. The travel-program tracker still uses
// promo.image which it pulls from TRAVEL_PROMO above — no need for the
// catalogue here.

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

// `getBestReward` was previously used by the Command Center's right-side
// hero panel that we removed. Kept removed here too — `<LuxuryRewardsCard>`
// is the page's "closest reward" surface now.

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
  kycStatus,
  isProgramLocked,
}: {
  reward: Reward;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
  kycStatus: KycStatus | null;
  isProgramLocked: boolean;
}) => {
  const wasReceived = !!reward.transferredFrom;

  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = wasReceived
    ? 100
    : Math.min(total > 0 ? (current / total) * 100 : 0, 100);

  // The sender's full name used to come from the preloaded recipients list,
  // but that list has been removed (it was a 22s / 1.3MB endpoint dump).
  // We fall back to showing the sender's userId instead — accurate enough,
  // and the name can be resolved on hover/click in a future iteration.
  const sender = reward.transferredFrom
    ? { fullName: reward.transferredFrom, userId: reward.transferredFrom }
    : null;

  const showTransferredStatus = reward.isTransferred;
  const canTransferReward = !reward.isTransferred && !wasReceived && !isProgramLocked;
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
            className="wallet-red-control w-full rounded-xl bg-[#C81E4A] font-semibold !text-white hover:bg-[#A90D32]"
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
    <Card className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-black text-[#0F172A] sm:text-xl">
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
        <p className="flex items-center gap-2 pt-1 text-xs text-[#64748B] sm:text-base">
          <Gift className="w-4 h-4 text-emerald-500" />
          Target: ₹{reward.rewardSnapshot.valueUSD.toLocaleString('en-IN')}
        </p>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col justify-between space-y-3 p-4 sm:space-y-4 sm:p-6">
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

        <div className="mt-auto space-y-2 pt-3 sm:space-y-3 sm:pt-4">
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

const RewardsHeader = () => (
  // The "Rules & Info" button previously here didn't open a modal — it just
  // set a toast saying "rules are shown throughout this page." Removed
  // because <LuxuryTierRulesPanel> below now holds the actual rules content.
  <header>
    <h1 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
      Rewards <span aria-hidden="true">🏆</span>
    </h1>
    <p className="mt-1 hidden text-sm text-[#64748B] sm:block sm:text-base">
      Unlock amazing travel experiences and luxury rewards.
    </p>
  </header>
);

const RewardsCommandCenter = ({
  directProgress,
  teamProgress,
  activeLegs,
}: {
  directProgress: ReturnType<typeof getRewardProgress>;
  teamProgress: ReturnType<typeof getRewardProgress>;
  activeLegs: number;
}) => {
  // The right-side "Closest Reward" hero panel that used to live here was
  // removed during the rewards-page cleanup — it duplicated the headline
  // info that <LuxuryRewardsCard> shows directly below the Command Center,
  // and its low-opacity trophy image was washing out the white text on top
  // of the dark gradient. The `bestReward`/`bestPercent`/`remaining` locals
  // it computed went away with it.
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(200,30,74,0.10),transparent_26%),radial-gradient(circle_at_85%_12%,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:p-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#C81E4A]">
            <Sparkles className="h-3.5 w-3.5" />
            Rewards Overview
          </span>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl">
            Your progress at a glance
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Direct Progress</p>
            <p className="mt-1 text-2xl font-black text-[#0F172A]">{directProgress.percent}%</p>
            <p className="truncate text-xs font-semibold text-slate-500">{formatCurrency(directProgress.current)}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Team Progress</p>
            <p className="mt-1 text-2xl font-black text-[#0F172A]">{teamProgress.percent}%</p>
            <p className="truncate text-xs font-semibold text-slate-500">{formatCurrency(teamProgress.current)}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Active Legs</p>
            <p className="mt-1 text-2xl font-black text-[#0F172A]">{activeLegs}</p>
            <p className="text-xs font-semibold text-slate-500">This cycle</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const RewardProgramHub = ({
  programs,
  rewardsByProgram,
}: {
  programs: RewardProgram[];
  rewardsByProgram: Record<string, Reward[]>;
}) => (
  <section id="reward-programs" className="scroll-mt-6">
    <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C81E4A]">Reward Programs</p>
        <h2 className="mt-1 text-2xl font-black text-[#0F172A] sm:text-3xl">Choose your track</h2>
      </div>
    </div>
    {/* The "Luxury Rewards" tile + "View progress →" CTA used to live here
        and linked to /rewards/luxury. After Phase 2 that page now redirects
        back to /rewards, so the tile was a dead circular link. Removed — the
        live luxury progress is already shown by <LuxuryRewardsCard> higher up. */}
    <div className="grid gap-3 lg:grid-cols-2">
      {programs.map((program) => {
        const promo = TRAVEL_PROMO[program.programId];
        const progress = getRewardProgress(rewardsByProgram[program.programId] ?? []);
        if (!promo) return null;
        return (
          <button
            key={program.programId}
            type="button"
            onClick={() => document.getElementById(`tracker-${program.programId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="group relative min-h-[230px] overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-0 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
          >
            <Image src={promo.image} alt={promo.title} fill className="object-cover transition duration-300 group-hover:scale-105" sizes="33vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-transparent" />
            <div className="relative flex min-h-[230px] flex-col justify-between p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-black backdrop-blur">{program.status}</span>
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-[#063B22]">{progress.percent}%</span>
              </div>
              <div>
                <h3 className="text-2xl font-black">{promo.title}</h3>
                <p className="mt-1 text-sm font-semibold text-white/75">{promo.subtitle}</p>
                <p className="mt-3 text-xs font-bold text-white/70">{formatCurrency(progress.current)} / {progress.target ? formatCurrency(progress.target) : "Target pending"}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  </section>
);

// ─── Transfer Modal ──────────────────────────────────────────────────────────

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
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Debounced server-side search. We deliberately do not fetch all 14k users
  // upfront — the backend supports `?q=` for paginated matches. Typing a
  // recipient's name or userId triggers a request 300ms after the user stops.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || (selectedRecipient && searchQuery.startsWith(selectedRecipient.fullName))) {
      // Empty input, or the user just picked someone (we set the input to
      // their name + id) — don't re-query.
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
                    selectedRecipient?.userId === r.userId
                      ? "bg-emerald-50"
                      : ""
                  }`}
                >
                  <p className="font-semibold text-[#0F172A]">{r.fullName}</p>
                  <p className="text-sm text-[#64748B]">{r.userId}</p>
                </button>
              ))
            ) : searchQuery.trim() ? (
              <p className="p-3 text-[#64748B]">No matching users found.</p>
            ) : (
              <p className="p-3 text-[#64748B]">Start typing a name or user ID…</p>
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
            className="wallet-red-control bg-[#C81E4A] !text-white hover:bg-[#A90D32]"
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
  kycStatus,
  onTransfer,
  onUploadDocuments,
}: {
  program: RewardProgram;
  rewards: Reward[];
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
    <section id={`tracker-${program.programId}`} className="scroll-mt-8 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-6">
      <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
        <span className="text-[#C81E4A]">
          {PROGRAM_ICONS[program.programId] ?? <Gift className="w-5 h-5" />}
        </span>
        <h2 className="text-lg font-black text-[#0F172A] sm:text-2xl">{program.name}</h2>
        {isLocked && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Ended
          </span>
        )}
      </div>

      {/* Self / Team toggle */}
      <div className="mb-4 flex border-b border-slate-200 sm:mb-6">
        {selfRewards.length > 0 && (
          <button
            onClick={() => setActiveType("self")}
            className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 sm:px-4 sm:text-base ${
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
            className={`px-3 py-2 text-sm font-semibold transition-colors duration-200 sm:px-4 sm:text-base ${
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
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
          >
            {displayRewards.map((reward) => (
              <RewardCard
                key={reward._id}
                reward={reward}
                onTransfer={onTransfer}
                onUploadDocuments={onUploadDocuments}
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
  // Recipients are NOT preloaded — see comments around the auth-effect
  // below. The TransferModal does its own debounced server-side search.
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

  // Recipients are NOT preloaded — TransferModal does its own
  // debounced server-side search via `getTransferRecipients(false, q, 20)`.

  const fetchInitialData = useCallback(async () => {
    setDataLoading(true);
    try {
      // Critical-path fan-out for /rewards. Earlier cleanup history:
      //   • Phase 1: dropped getProfileData / getDashboardData (both wasted) and
      //     swapped getReferralSummary → getActiveLegsCount (lightweight count).
      //     getTransferRecipients moved to lazy fetchRecipients() below.
      //   • Phase 3: dropped getLeaderboard('team') — TopPerformersCard removed
      //     from this page; that was the last heavy $graphLookup-backed call.
      const [rewardsData, programsData, kycData, activeLegsResp] =
        await Promise.all([
          getRewards(),
          getRewardPrograms(),
          getKycStatus(),
          getActiveLegsCount(),
        ]);

      if (activeLegsResp && !('error' in activeLegsResp)) {
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
      // Critical path: rewards / programs / KYC / active-legs
      fetchInitialData();
      // Recipients list is INTENTIONALLY NOT fetched here. The backend
      // endpoint `/user/transfer-recipients` returns every user in the
      // system (~14k rows, ~1.3MB) and takes ~22s on Render — that's the
      // "second load 20s later" experience users were reporting. Instead
      // we fetch on demand the moment a user clicks "Transfer" (see
      // `onTransfer` handler below). Initial paint stays clean.
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
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-7">
          <RewardsHeader />

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

          <RewardsCommandCenter
            directProgress={directProgress}
            teamProgress={teamProgress}
            activeLegs={activeLegs}
          />

          {/* Luxury Rewards — merged from the old standalone /rewards/luxury page.
              The card shows the user's live tier progress; the rules panel below
              is collapsed by default and holds the tier-target reference content. */}
          <LuxuryRewardsCard />
          <LuxuryTierRulesPanel />

          <RewardProgramHub programs={displayPrograms} rewardsByProgram={rewardsByProgram} />

          {/* Removed in the rewards-page cleanup:
              - <BenefitsStrip /> — 5 marketing pills with no functional info
              - <TopPerformersCard /> — team leaderboard belongs on /team (also was the only consumer of the heavy getLeaderboard call)
              - <AchievementsCard /> — duplicated "Active Legs" already shown above in the Command Center + LuxuryRewardsCard
              - <MotivationCard /> — decorative quote with no info value (also saved ~3MB image asset)
              The component definitions remain in this file for now in case team
              wants any of them back; nothing renders them. */}

          <section id="reward-operations" className="scroll-mt-6 space-y-4 sm:space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C81E4A]">Claims & Documents</p>
              <h2 className="mt-1 text-xl font-black text-[#0F172A] sm:text-2xl">Reward Operations</h2>
              <p className="mt-1 hidden text-sm text-[#64748B] sm:block">
                Track claim status, upload documents, and transfer eligible rewards without leaving this page.
              </p>
            </div>
          {displayPrograms.map((program) => (
              <ProgramTracker
                key={program.programId}
                program={program}
                rewards={rewardsByProgram[program.programId] ?? []}
                kycStatus={kycStatus}
                onTransfer={(reward) => setTransferModalReward(reward)}
                onUploadDocuments={(reward) => setUploadModalReward(reward)}
              />
            ))}
          </section>
        </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
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
