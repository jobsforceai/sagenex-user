"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Crown, Lock, Sparkles, Target, Trophy } from "lucide-react";
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
  // Backend sets this when the read path returned an empty placeholder and
  // kicked a background recompute. The card uses it to show a "Calculating"
  // state and poll until real data is available.
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

const TIER_META: Record<TierId, { label: string; icon: typeof Crown; accent: string; soft: string }> = {
  "10L": { label: "Starter", icon: Sparkles, accent: "text-[#C81E4A]", soft: "bg-white border-slate-200" },
  "30L": { label: "Mid", icon: Trophy, accent: "text-[#C81E4A]", soft: "bg-white border-slate-200" },
  "50L": { label: "Elite", icon: Target, accent: "text-[#C81E4A]", soft: "bg-white border-slate-200" },
  "1CR": { label: "Crown", icon: Crown, accent: "text-[#C81E4A]", soft: "bg-white border-slate-200" },
};

const TARGET_ORDER: TierId[] = ["10L", "30L", "50L", "1CR"];

const inr = (n = 0) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const lakh = (n = 0) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(2)}L`
  : inr(n);

const clampPct = (value = 0) => Math.min(100, Math.max(0, Math.round(value)));

const daysLeft = (endsAt?: string | Date | null) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 3600 * 1000)));
};

const tierScore = (tier: TierProgress) =>
  clampPct(((tier.teamBizPct ?? 0) + (tier.directBizPct ?? 0) + (tier.legsPct ?? 0)) / 3);

const missingText = (tier?: TierProgress) => {
  if (!tier?.missing) return "Qualification data is being calculated.";
  const missing: string[] = [];
  if ((tier.missing.teamBizINR ?? 0) > 0) missing.push(`${lakh(tier.missing.teamBizINR)} team business`);
  if ((tier.missing.directBizINR ?? 0) > 0) missing.push(`${lakh(tier.missing.directBizINR)} direct business`);
  if ((tier.missing.legs ?? 0) > 0) missing.push(`${tier.missing.legs} active leg${tier.missing.legs === 1 ? "" : "s"}`);
  return missing.length ? missing.join(" + ") : "All visible requirements are complete.";
};

export default function LuxuryRewardsCard() {
  const [data, setData] = useState<LuxuryProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  // The backend serves SWR data instantly. If it returns `computing: true`
  // (no cached cycle yet, background recompute kicked off), we silently
  // re-fetch every 4s up to 8 times until the real cycle appears. The user
  // never waits on a synchronous compute — they see "Calculating…" briefly
  // and then real progress lands without re-rendering the whole page.
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
  const NextIcon = nextMeta.icon;
  const nextScore = tierScore(nextTier ?? { tierId: "10L" });
  const pendingApproval = cycle?.status === "REWARD_PENDING_APPROVAL";
  const claimable = pendingApproval && cycle?.approvedAt;
  const claimed = cycle?.status === "CLAIMED";
  const days = daysLeft(nextTier?.windowEndsAt);
  const requirementItems = [
    {
      label: "Team Gate",
      metric: "Capped Team",
      value: `${nextTier?.teamBizPct ?? 0}%`,
      progress: nextTier?.teamBizPct ?? 0,
      helper: (nextTier?.missing?.teamBizINR ?? 0) > 0
        ? `Need ${lakh(nextTier?.missing?.teamBizINR)} more`
        : "Complete",
    },
    {
      label: "Direct Gate",
      metric: "Direct Business",
      value: `${nextTier?.directBizPct ?? 0}%`,
      progress: nextTier?.directBizPct ?? 0,
      helper: (nextTier?.missing?.directBizINR ?? 0) > 0
        ? `Need ${lakh(nextTier?.missing?.directBizINR)} more`
        : "Complete",
    },
    {
      label: "Leg Gate",
      metric: "Active Legs",
      value: `${nextTier?.legsPct ?? 0}%`,
      progress: nextTier?.legsPct ?? 0,
      helper: (nextTier?.missing?.legs ?? 0) > 0
        ? `Need ${nextTier?.missing?.legs} more`
        : "Complete",
    },
  ];
  const cycleStatusLabel = claimed
    ? `Claimed: ${cycle?.qualifiedTierId}`
    : pendingApproval
      ? `Qualified for ${cycle?.qualifiedTierId}`
      : cycle?.kind === "CARRY"
        ? "Carry cycle active"
        : "Luxury cycle active";
  const remainingMissions = requirementItems.filter((item) => item.progress < 100).length;

  if (loading) {
    return (
      <section className="rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="h-6 w-44 rounded-full bg-slate-100" />
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="h-56 rounded-3xl bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  if (!snap?.hasAnchor) {
    const isComputing = !!snap?.computing;
    return (
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFC] p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-11 w-11 rounded-2xl bg-white p-2.5 text-[#C81E4A] shadow-sm" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C81E4A]">Your Progress</p>
                <h2 className="text-2xl font-black text-[#0F172A]">
                  {isComputing ? "Calculating progress…" : "Not started yet"}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {isComputing
                ? "We're crunching your team's numbers. This usually completes in a few seconds — your luxury progress will appear here automatically."
                : "Make your first new-plan deposit to unlock Luxury Rewards tracking. Once unlocked, this panel will show your closest reward, missing business, active legs, and cycle deadline."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-2">
            {TARGET_ORDER.map((tierId) => {
              const meta = TIER_META[tierId];
              const Icon = meta.icon;
              return (
                <div key={tierId} className={`rounded-2xl border p-4 ${meta.soft}`}>
                  <Icon className={`h-7 w-7 ${meta.accent}`} />
                  <p className="mt-3 text-xl font-black text-[#0F172A]">{tierId}</p>
                  <p className="text-xs font-bold text-slate-500">{meta.label} reward</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-slate-200 bg-[#F8FAFC] p-5">
            <div className="grid gap-5 lg:grid-cols-[150px_1fr] lg:items-center">
              <div className="mx-auto flex flex-col items-center lg:mx-0">
                <div
                  className="grid h-36 w-36 place-items-center rounded-full p-2 shadow-[0_18px_45px_rgba(200,30,74,0.12)]"
                  style={{
                    background: `conic-gradient(#C81E4A ${nextScore * 3.6}deg, #E2E8F0 0deg)`,
                  }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full border border-slate-200 bg-white text-center">
                    <div>
                      <p className="text-4xl font-black leading-none text-[#0F172A]">{nextScore}%</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Unlocked</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-[#0F172A]">
                    {remainingMissions === 0 ? "Ready" : `${remainingMissions} gates left`}
                  </span>
                  {days !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-[#0F172A]">
                      <Clock className="h-3.5 w-3.5 text-[#C81E4A]" />
                      {days}d left
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C81E4A]">Mission Active</p>
                    <h2 className="mt-2 text-3xl font-black leading-none text-[#0F172A] sm:text-4xl">
                      {nextTier?.tierId ?? "10L"} {nextMeta.label}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-[#64748B]">Clear every gate below to unlock this reward.</p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#C81E4A] shadow-sm">
                    <NextIcon className="h-6 w-6" />
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[#F4B4C4] bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C81E4A]">Next Unlock Move</p>
                  <p className="mt-1 text-lg font-black text-[#0F172A]">{missingText(nextTier)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {requirementItems.map((item) => {
                const complete = item.progress >= 100;
                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-3 ${
                      complete ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#64748B]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {item.metric}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        complete ? "bg-emerald-100 text-emerald-700" : "bg-[#FFF1F4] text-[#C81E4A]"
                      }`}>
                        {complete ? "Cleared" : item.value}
                      </span>
                    </div>
                    <p className={`mt-3 text-sm font-black ${complete ? "text-emerald-700" : "text-[#0F172A]"}`}>
                      {item.helper}
                    </p>
                    <Progress value={item.progress} className="mt-3 h-1.5 bg-slate-200" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#64748B]">Level Map</p>
                <h3 className="mt-1 text-xl font-black text-[#0F172A]">Reward ladder</h3>
              </div>
              <Badge className="w-fit rounded-full bg-[#FFF1F4] px-3 py-1 text-[#C81E4A] hover:bg-[#FFF1F4]">
                {cycleStatusLabel}
              </Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {tierProgress.map((tier, index) => {
                const meta = TIER_META[tier.tierId];
                const Icon = meta.icon;
                const score = tierScore(tier);
                const current = tier.tierId === nextTier?.tierId;
                return (
                  <div
                    key={tier.tierId}
                    className="relative text-center"
                  >
                    {index < tierProgress.length - 1 && (
                      <span
                        className={`absolute left-[calc(50%+28px)] right-[calc(-50%+28px)] top-7 hidden h-1 rounded-full sm:block ${
                          tier.qualified ? "bg-emerald-300" : current ? "bg-[#F4B4C4]" : "bg-slate-200"
                        }`}
                      />
                    )}
                    <div className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-4 bg-white shadow-sm ${
                      tier.qualified
                        ? "border-emerald-200 text-emerald-700"
                        : current
                          ? "border-[#F4B4C4] text-[#C81E4A]"
                          : "border-slate-200 text-slate-400"
                    }`}>
                      {tier.qualified ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-black text-[#0F172A]">{tier.tierId}</p>
                    <p className="text-xs font-semibold text-[#64748B]">{meta.label}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                      tier.qualified
                        ? "bg-emerald-100 text-emerald-700"
                        : current
                          ? "bg-[#C81E4A] text-white"
                          : "bg-slate-100 text-slate-500"
                    }`}>
                      {tier.qualified ? "Cleared" : current ? "Current Boss" : `${score}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Capped Team</p>
                <p className="mt-1 text-lg font-black text-[#0F172A]">{lakh(snap.cappedTeamBusinessINR)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Direct</p>
                <p className="mt-1 text-lg font-black text-[#0F172A]">{lakh(snap.directBusinessINR)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Legs</p>
                <p className="mt-1 text-lg font-black text-[#0F172A]">{snap.activeLegsCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {(cycle?.kind === "CARRY" || pendingApproval || claimed) && (
          <div className="rounded-2xl border border-[#F4B4C4] bg-[#FFF8FA] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#7A001F]">{cycleStatusLabel}</p>
                <p className="text-xs font-semibold text-[#A90D32]">
                  {claimable ? "Admin approved. Claim now to lock your reward." : "Reward status is being reviewed by admin."}
                </p>
              </div>
              {claimable && (
                <Button disabled={claiming} onClick={handleClaim}>
                  {claiming ? "Claiming..." : "Claim reward"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
