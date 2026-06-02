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
  "10L": { label: "Starter", icon: Sparkles, accent: "text-emerald-700", soft: "bg-emerald-50 border-emerald-100" },
  "30L": { label: "Mid", icon: Trophy, accent: "text-blue-700", soft: "bg-blue-50 border-blue-100" },
  "50L": { label: "Elite", icon: Target, accent: "text-violet-700", soft: "bg-violet-50 border-violet-100" },
  "1CR": { label: "Crown", icon: Crown, accent: "text-amber-700", soft: "bg-amber-50 border-amber-100" },
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
          <div className="rounded-3xl bg-gradient-to-br from-[#FFF1F4] via-white to-amber-50 p-5">
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
                <div key={tierId} className={`rounded-3xl border p-4 ${meta.soft}`}>
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
      <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[0.85fr_1.15fr]">
        <div data-luxury-dark className="rounded-3xl bg-gradient-to-br from-[#063B22] via-[#0B5A35] to-[#7A001F] p-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-100">Your Closest Reward</p>
              <h2 className="mt-2 text-4xl font-black">{nextTier?.tierId ?? "10L"} {nextMeta.label}</h2>
              <p className="mt-2 text-sm font-semibold text-white/72">Need {missingText(nextTier)}</p>
            </div>
            <NextIcon className="h-12 w-12 rounded-2xl bg-white/10 p-2.5 text-amber-200" />
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <p className="text-6xl font-black">{nextScore}%</p>
              {days !== null && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                  <Clock className="h-3.5 w-3.5" />
                  {days}d left
                </span>
              )}
            </div>
            <Progress value={nextScore} className="mt-4 h-2 bg-white/15" />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55">Team</p>
              <p className="mt-1 text-sm font-black">{nextTier?.teamBizPct ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55">Direct</p>
              <p className="mt-1 text-sm font-black">{nextTier?.directBizPct ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55">Legs</p>
              <p className="mt-1 text-sm font-black">{nextTier?.legsPct ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Capped Team</p>
              <p className="mt-1 text-2xl font-black text-[#0F172A]">{lakh(snap.cappedTeamBusinessINR)}</p>
              <p className="text-xs font-semibold text-slate-500">Raw {lakh(snap.rawTeamBusinessINR)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Direct Business</p>
              <p className="mt-1 text-2xl font-black text-[#0F172A]">{lakh(snap.directBusinessINR)}</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Active Legs</p>
              <p className="mt-1 text-2xl font-black text-[#0F172A]">{snap.activeLegsCount ?? 0}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tierProgress.map((tier) => {
              const meta = TIER_META[tier.tierId];
              const Icon = meta.icon;
              const score = tierScore(tier);
              return (
                <div key={tier.tierId} className={`rounded-3xl border p-4 ${meta.soft}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${meta.accent}`} />
                      <p className="font-black text-[#0F172A]">{tier.tierId} {meta.label}</p>
                    </div>
                    {tier.qualified ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Qualified
                      </Badge>
                    ) : (
                      <span className="text-xs font-black text-slate-500">{score}%</span>
                    )}
                  </div>
                  <Progress value={score} className="mt-3 h-1.5" />
                  <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500">{missingText(tier)}</p>
                </div>
              );
            })}
          </div>

          {(cycle?.kind === "CARRY" || pendingApproval || claimed) && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-amber-900">
                    {claimed ? `Claimed: ${cycle?.qualifiedTierId}` : pendingApproval ? `Qualified for ${cycle?.qualifiedTierId}` : "Carry cycle active"}
                  </p>
                  <p className="text-xs font-semibold text-amber-800">
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
      </div>
    </section>
  );
}
