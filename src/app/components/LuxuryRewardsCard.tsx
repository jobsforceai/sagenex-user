"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  Crown,
  Loader2,
  Lock,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { getLuxuryProgress, claimLuxuryReward } from "@/actions/luxury-rewards";

type TierId = "10L" | "30L" | "50L" | "1CR";

type TierProgress = {
  tierId: TierId;
  qualified?: boolean;
  windowOpen?: boolean;
  windowEndsAt?: string | Date | null;
  teamBizPct?: number;
  directBizPct?: number;
  legsPct?: number;
  missing?: {
    teamBizINR?: number;
    directBizINR?: number;
    legs?: number;
  };
};

type LuxurySnapshot = {
  hasAnchor?: boolean;
  computing?: boolean;
  cappedTeamBusinessINR?: number;
  rawTeamBusinessINR?: number;
  directBusinessINR?: number;
  activeLegsCount?: number;
  tierProgress?: TierProgress[];
};

type LuxuryCycle = {
  _id?: string;
  kind?: "CARRY" | string;
  status?: string;
  approvedAt?: string | Date | null;
  qualifiedTierId?: TierId;
};

type LuxuryProgressResponse = {
  snapshot?: LuxurySnapshot;
  cycle?: LuxuryCycle;
  error?: string;
};

const TIER_META: Record<TierId, { label: string; icon: typeof Crown }> = {
  "10L": { label: "Starter", icon: Sparkles },
  "30L": { label: "Mid", icon: Trophy },
  "50L": { label: "Elite", icon: Target },
  "1CR": { label: "Crown", icon: Crown },
};

const TARGET_ORDER: TierId[] = ["10L", "30L", "50L", "1CR"];

const inr = (n = 0) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const lakh = (n = 0) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)}Cr`
    : n >= 100000
      ? `₹${(n / 100000).toFixed(2)}L`
      : inr(n);

const clampPct = (value = 0) => Math.min(100, Math.max(0, Math.round(value)));

const daysLeft = (endsAt?: string | Date | null) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
};

const tierScore = (tier: TierProgress) =>
  clampPct(((tier.teamBizPct ?? 0) + (tier.directBizPct ?? 0) + (tier.legsPct ?? 0)) / 3);

function nextActionText(tier?: TierProgress) {
  if (!tier?.missing) return "Keep building your team — you're on track.";
  if ((tier.missing.legs ?? 0) > 0) {
    const n = tier.missing.legs ?? 0;
    return `Get ${n} more active team leg${n === 1 ? "" : "s"}`;
  }
  if ((tier.missing.teamBizINR ?? 0) > 0) {
    return `Add ${lakh(tier.missing.teamBizINR)} more team sales`;
  }
  if ((tier.missing.directBizINR ?? 0) > 0) {
    return `Add ${lakh(tier.missing.directBizINR)} more of your own sales`;
  }
  return "All requirements done — waiting for approval.";
}

type LuxuryRewardsCardProps = {
  variant?: "full" | "tile";
  onTileClick?: () => void;
};

export default function LuxuryRewardsCard({ variant = "full", onTileClick }: LuxuryRewardsCardProps) {
  const [data, setData] = useState<LuxuryProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    const res = await getLuxuryProgress();
    if (res?.error) {
      if (!isPoll) toast.error(res.error);
    } else {
      setData(res as LuxuryProgressResponse);
    }
    if (!isPoll) setLoading(false);
    return res as LuxuryProgressResponse;
  };

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const res = await load(attempts > 0);
      if (cancelled) return;
      const stillComputing = res?.snapshot?.computing && !res?.cycle;
      attempts += 1;
      if (stillComputing && attempts < 8) {
        timer = setTimeout(tick, 4000);
      }
    };
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClaim = async () => {
    if (!data?.cycle?._id) return;
    setClaiming(true);
    const res = await claimLuxuryReward(data.cycle._id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Reward claimed!");
      await load();
    }
    setClaiming(false);
  };

  const snap = data?.snapshot;
  const cycle = data?.cycle;
  const tierProgress = useMemo(() => snap?.tierProgress ?? [], [snap?.tierProgress]);
  const nextTier = useMemo(() => {
    const openUnqualified = tierProgress.find((tier) => !tier.qualified && tier.windowOpen !== false);
    return openUnqualified ?? tierProgress.find((tier) => !tier.qualified) ?? tierProgress[tierProgress.length - 1];
  }, [tierProgress]);
  const nextMeta = nextTier ? TIER_META[nextTier.tierId] : TIER_META["10L"];
  const nextScore = tierScore(nextTier ?? { tierId: "10L" });
  const pendingApproval = cycle?.status === "REWARD_PENDING_APPROVAL";
  const claimable = pendingApproval && cycle?.approvedAt;
  const claimed = cycle?.status === "CLAIMED";
  const days = daysLeft(nextTier?.windowEndsAt);

  const requirementItems = [
    {
      id: "team",
      label: "Team sales",
      progress: clampPct(nextTier?.teamBizPct),
      helper:
        (nextTier?.missing?.teamBizINR ?? 0) > 0
          ? `Need ${lakh(nextTier?.missing?.teamBizINR)} more`
          : "Done",
    },
    {
      id: "direct",
      label: "Your sales",
      progress: clampPct(nextTier?.directBizPct),
      helper:
        (nextTier?.missing?.directBizINR ?? 0) > 0
          ? `Need ${lakh(nextTier?.missing?.directBizINR)} more`
          : "Done",
    },
    {
      id: "legs",
      label: "Active teams",
      progress: clampPct(nextTier?.legsPct),
      helper:
        (nextTier?.missing?.legs ?? 0) > 0
          ? `Need ${nextTier?.missing?.legs} more`
          : "Done",
    },
  ];

  const renderTile = () => {
    const isComputing = !!snap?.computing;
    const hasAnchor = !!snap?.hasAnchor;
    const score = hasAnchor ? nextScore : 0;
    const statusLabel = !hasAnchor
      ? isComputing
        ? "Calculating"
        : "Locked"
      : claimed
        ? "Claimed"
        : claimable
          ? "Claim now"
          : pendingApproval
            ? "In review"
            : `${score}%`;

    const statusTone =
      statusLabel === "Claimed"
        ? "bg-emerald-50 text-emerald-700"
        : statusLabel === "Claim now"
          ? "bg-amber-50 text-amber-700"
          : statusLabel === "In review"
            ? "bg-blue-50 text-blue-700"
            : "bg-slate-100 text-slate-600";

    return (
      <button
        type="button"
        onClick={onTileClick}
        className="flex h-full w-full flex-col rounded-2xl border border-slate-200/70 bg-white p-4 text-left shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#C41E3A]">
            <Crown className="h-5 w-5" />
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>{statusLabel}</span>
        </div>
        <p className="mt-3 text-base font-black text-[#0F172A]">Luxury rewards</p>
        <p className="mt-1 text-sm text-[#64748B]">
          {hasAnchor ? `${nextTier?.tierId ?? "10L"} ${nextMeta.label}` : "Deposit to unlock"}
        </p>
        {hasAnchor && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#C41E3A]" style={{ width: `${score}%` }} />
          </div>
        )}
        {hasAnchor && days !== null && (
          <p className="mt-2 text-xs font-semibold text-[#64748B]">{days} days left</p>
        )}
      </button>
    );
  };

  if (loading) {
    if (variant === "tile") {
      return <div className="h-[168px] animate-pulse rounded-2xl border border-slate-200/70 bg-white" />;
    }
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#C41E3A]" />
          <p className="text-sm font-semibold text-[#64748B]">Loading luxury rewards…</p>
        </div>
      </section>
    );
  }

  if (!snap?.hasAnchor) {
    const isComputing = !!snap?.computing;
    if (variant === "tile") return renderTile();
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-8">
        <div className="flex items-start gap-4 lg:items-center lg:gap-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F4]">
            <Lock className="h-6 w-6 text-[#C41E3A]" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Luxury rewards</p>
            <h2 className="mt-1 text-xl font-black text-[#0F172A]">
              {isComputing ? "Calculating your progress…" : "Not started yet"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
              {isComputing
                ? "Your numbers are being calculated. This usually takes a few seconds."
                : "Make your first new-plan deposit to start tracking luxury rewards."}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
          {TARGET_ORDER.map((tierId) => {
            const meta = TIER_META[tierId];
            const Icon = meta.icon;
            return (
              <div key={tierId} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
                <Icon className="h-5 w-5 text-[#C41E3A]" />
                <p className="mt-2 text-sm font-black text-[#0F172A]">{tierId}</p>
                <p className="text-xs text-[#64748B]">{meta.label}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (variant === "tile") return renderTile();

  const incompleteCount = requirementItems.filter((item) => item.progress < 100).length;
  const NextIcon = nextMeta.icon;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {/* Hero */}
      <div className="border-b border-slate-100 bg-gradient-to-b from-[#FFF8FA] to-white p-5 lg:p-8">
        <div className="lg:flex lg:items-center lg:gap-10">
          <div className="mx-auto hidden shrink-0 flex-col items-center lg:flex">
            <div
              className="grid h-36 w-36 place-items-center rounded-full p-2 shadow-[0_18px_45px_rgba(200,30,74,0.12)]"
              style={{
                background: `conic-gradient(#C41E3A ${nextScore * 3.6}deg, #E2E8F0 0deg)`,
              }}
            >
              <div className="grid h-full w-full place-items-center rounded-full border border-slate-200 bg-white text-center">
                <div>
                  <p className="text-3xl font-black leading-none text-[#0F172A]">{nextScore}%</p>
                  <p className="mt-1 text-xs font-bold text-[#64748B]">Complete</p>
                </div>
              </div>
            </div>
            <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#C41E3A]">
              <NextIcon className="h-5 w-5" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Luxury rewards</p>
            <h2 className="mt-1 text-2xl font-black text-[#0F172A] lg:text-3xl">
              {nextTier?.tierId ?? "10L"} {nextMeta.label}
            </h2>

            <div className="mt-4 lg:max-w-xl">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#64748B]">Overall progress</span>
                <span className="font-black text-[#0F172A] lg:hidden">{nextScore}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#C41E3A] transition-all"
                  style={{ width: `${nextScore}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {incompleteCount > 0 && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0F172A] ring-1 ring-slate-200">
                  {incompleteCount} step{incompleteCount === 1 ? "" : "s"} left
                </span>
              )}
              {days !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0F172A] ring-1 ring-slate-200">
                  <Clock className="h-3.5 w-3.5 text-[#C41E3A]" />
                  {days} days left
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
        {/* Left: action + checklist */}
        <div className="lg:flex lg:flex-col">
          <div className="border-b border-slate-100 p-5 lg:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-[#C41E3A]">Do this next</p>
            <p className="mt-2 text-lg font-black leading-snug text-[#0F172A] lg:text-xl">
              {nextActionText(nextTier)}
            </p>
          </div>

          <div className="border-b border-slate-100 p-5 lg:flex-1 lg:border-b-0 lg:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Your checklist</p>
            <ul className="space-y-3 md:grid md:grid-cols-3 md:gap-3 md:space-y-0 lg:grid-cols-1 lg:space-y-3">
              {requirementItems.map((item) => {
                const done = item.progress >= 100;
                return (
                  <li
                    key={item.id}
                    className={`rounded-2xl border p-4 ${done ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-[#F8FAFC]"}`}
                  >
                    <div className="flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#C41E3A]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-black ${done ? "text-emerald-800" : "text-[#0F172A]"}`}>
                            {item.label}
                          </p>
                          <span
                            className={`shrink-0 text-xs font-bold ${done ? "text-emerald-700" : "text-[#64748B]"}`}
                          >
                            {done ? "Done" : `${item.progress}%`}
                          </span>
                        </div>
                        <p className={`mt-1 text-sm ${done ? "text-emerald-700" : "text-[#64748B]"}`}>
                          {item.helper}
                        </p>
                        {!done && <Progress value={item.progress} className="mt-3 h-2 bg-slate-200" />}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: numbers + levels */}
        <div className="lg:flex lg:flex-col">
          <div className="border-b border-slate-100 p-5 lg:p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#64748B]">Your numbers</p>
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-center lg:p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Team</p>
                <p className="mt-1 text-sm font-black text-[#0F172A] lg:text-lg">
                  {lakh(snap.cappedTeamBusinessINR)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-center lg:p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">You</p>
                <p className="mt-1 text-sm font-black text-[#0F172A] lg:text-lg">
                  {lakh(snap.directBusinessINR)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 text-center lg:p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">Legs</p>
                <p className="mt-1 text-sm font-black text-[#0F172A] lg:text-lg">
                  {snap.activeLegsCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 lg:flex-1 lg:p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wide text-[#64748B]">All reward levels</p>

            {/* Mobile: vertical ladder */}
            <ol className="space-y-0 lg:hidden">
              {tierProgress.map((tier, index) => {
                const meta = TIER_META[tier.tierId];
                const Icon = meta.icon;
                const score = tierScore(tier);
                const isCurrent = tier.tierId === nextTier?.tierId && !tier.qualified;
                const isLast = index === tierProgress.length - 1;

                return (
                  <li key={tier.tierId} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
                          tier.qualified
                            ? "border-emerald-300 text-emerald-600"
                            : isCurrent
                              ? "border-[#C41E3A] text-[#C41E3A]"
                              : "border-slate-200 text-slate-400"
                        }`}
                      >
                        {tier.qualified ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                      </div>
                      {!isLast && (
                        <span
                          className={`my-1 min-h-[20px] w-0.5 flex-1 ${
                            tier.qualified ? "bg-emerald-200" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                    <div
                      className={`mb-4 min-w-0 flex-1 rounded-2xl border p-3 ${
                        isCurrent ? "border-[#F4B4C4] bg-[#FFF8FA]" : "border-slate-200 bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#0F172A]">
                            {tier.tierId} {meta.label}
                          </p>
                          {isCurrent && (
                            <p className="mt-0.5 text-xs font-semibold text-[#C41E3A]">You are here</p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            tier.qualified
                              ? "bg-emerald-100 text-emerald-700"
                              : isCurrent
                                ? "bg-[#C41E3A] text-white"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {tier.qualified ? "Unlocked" : `${score}%`}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Desktop: horizontal stepper */}
            <ol className="hidden lg:grid lg:grid-cols-4 lg:gap-3">
              {tierProgress.map((tier, index) => {
                const meta = TIER_META[tier.tierId];
                const Icon = meta.icon;
                const score = tierScore(tier);
                const isCurrent = tier.tierId === nextTier?.tierId && !tier.qualified;

                return (
                  <li key={tier.tierId} className="relative text-center">
                    {index < tierProgress.length - 1 && (
                      <span
                        className={`absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-7 h-1 rounded-full ${
                          tier.qualified ? "bg-emerald-300" : isCurrent ? "bg-[#F4B4C4]" : "bg-slate-200"
                        }`}
                      />
                    )}
                    <div
                      className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 bg-white shadow-sm ${
                        tier.qualified
                          ? "border-emerald-300 text-emerald-600"
                          : isCurrent
                            ? "border-[#C41E3A] text-[#C41E3A]"
                            : "border-slate-200 text-slate-400"
                      }`}
                    >
                      {tier.qualified ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <p className="mt-3 text-sm font-black text-[#0F172A]">{tier.tierId}</p>
                    <p className="text-xs font-semibold text-[#64748B]">{meta.label}</p>
                    {isCurrent && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#C41E3A]">
                        You are here
                      </p>
                    )}
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        tier.qualified
                          ? "bg-emerald-100 text-emerald-700"
                          : isCurrent
                            ? "bg-[#C41E3A] text-white"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tier.qualified ? "Unlocked" : `${score}%`}
                    </span>
                  </li>
                );
              })}
            </ol>

            {(cycle?.kind === "CARRY" || pendingApproval || claimed) && (
              <div className="mt-4 rounded-2xl border border-[#F4B4C4] bg-[#FFF8FA] p-4 lg:mt-6">
                <div className="lg:flex lg:items-center lg:justify-between lg:gap-4">
                  <div>
                    <p className="text-sm font-black text-[#7A001F]">
                      {claimed
                        ? `Claimed: ${cycle?.qualifiedTierId}`
                        : pendingApproval
                          ? `Qualified for ${cycle?.qualifiedTierId}`
                          : "Carry cycle active"}
                    </p>
                    <p className="mt-1 text-xs text-[#A90D32]">
                      {claimable
                        ? "Approved — tap below to claim your reward."
                        : "Your reward is being reviewed."}
                    </p>
                  </div>
                  {claimable && (
                    <Button
                      disabled={claiming}
                      onClick={handleClaim}
                      className="mt-3 w-full shrink-0 rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#ad1b34] lg:mt-0 lg:w-auto"
                    >
                      {claiming ? "Claiming…" : "Claim reward"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
