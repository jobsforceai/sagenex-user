"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  CheckCircle2,
  Clock,
  Crown,
  Gift,
  Loader2,
  Sparkles,
  Users,
  IndianRupee,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimLuxuryReward, getLuxuryProgress } from "@/actions/luxury-rewards";
import SimpleLuxuryStages from "./SimpleLuxuryStages";
import {
  TIER_META,
  TIER_ORDER,
  clampPct,
  daysLeft,
  lakh,
  resolveStageStatus,
  type LuxuryProgressResponse,
  type StageStatus,
  type TierId,
  type TierProgress,
} from "./tier-meta";

function MissionRow({
  icon: Icon,
  title,
  currentLabel,
  targetLabel,
  pct,
  remainingLabel,
  done,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  currentLabel: string;
  targetLabel: string;
  pct: number;
  remainingLabel: string;
  done: boolean;
  hint?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        done ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-black text-[#0F172A]">{title}</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {currentLabel} <span className="text-slate-300">/</span> {targetLabel}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
            done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {done ? "Done" : remainingLabel}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            done ? "bg-emerald-500" : "bg-[#C41E3A]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && !done && (
        <p className="mt-2 text-[11px] font-medium leading-snug text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function StageMissions({
  tierId,
  progress,
  snapTeam,
  snapDirect,
  snapLegs,
}: {
  tierId: TierId;
  progress?: TierProgress;
  snapTeam: number;
  snapDirect: number;
  snapLegs: number;
}) {
  const meta = TIER_META[tierId];
  const teamPct = clampPct(progress?.teamBizPct);
  const directPct = clampPct(progress?.directBizPct);
  const legsPct = clampPct(progress?.legsPct);
  const teamDone = teamPct >= 100 || (progress?.missing?.teamBizINR ?? 0) <= 0;
  const directDone = directPct >= 100 || (progress?.missing?.directBizINR ?? 0) <= 0;
  const legsDone = legsPct >= 100 || (progress?.missing?.legs ?? 0) <= 0;
  const days = daysLeft(progress?.windowEndsAt);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <Clock className="h-3 w-3" />
          {days === null
            ? `${meta.windowDays}-day window`
            : progress?.windowOpen === false
              ? "Window ended"
              : `${days} day${days === 1 ? "" : "s"} left`}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          Finish all 3 missions to clear this stage
        </span>
      </div>

      <MissionRow
        icon={IndianRupee}
        title="Team business"
        currentLabel={lakh(snapTeam)}
        targetLabel={lakh(meta.teamBiz)}
        pct={teamPct}
        remainingLabel={
          (progress?.missing?.teamBizINR ?? 0) > 0
            ? `Need ${lakh(progress?.missing?.teamBizINR)}`
            : `${teamPct}%`
        }
        done={teamDone}
        hint="Max 50% of team business can come from one leg (power-leg rule)."
      />
      <MissionRow
        icon={Target}
        title="Direct business"
        currentLabel={lakh(snapDirect)}
        targetLabel={lakh(meta.directBiz)}
        pct={directPct}
        remainingLabel={
          (progress?.missing?.directBizINR ?? 0) > 0
            ? `Need ${lakh(progress?.missing?.directBizINR)}`
            : `${directPct}%`
        }
        done={directDone}
      />
      <MissionRow
        icon={Users}
        title="Active legs"
        currentLabel={`${snapLegs}`}
        targetLabel={`Min ${meta.legs}`}
        pct={legsPct}
        remainingLabel={
          (progress?.missing?.legs ?? 0) > 0 ? `Need ${progress?.missing?.legs} more` : `${legsPct}%`
        }
        done={legsDone}
      />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-[#0F172A] sm:text-base">{value}</p>
    </div>
  );
}

export default function LuxuryRoadPath() {
  const [data, setData] = useState<LuxuryProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<TierId | null>(null);
  const [selectedReady, setSelectedReady] = useState(false);
  const [computeTimedOut, setComputeTimedOut] = useState(false);

  const load = useCallback(async (isPoll = false) => {
    if (!isPoll) {
      setLoading(true);
      setComputeTimedOut(false);
    }
    const res = await getLuxuryProgress();
    if (res?.error) {
      if (!isPoll) toast.error(res.error);
      setData({ error: res.error });
    } else {
      setData(res as LuxuryProgressResponse);
    }
    if (!isPoll) setLoading(false);
    return res as LuxuryProgressResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const maxAttempts = 15;

    const tick = async () => {
      const res = await load(attempts > 0);
      if (cancelled) return;
      const stillComputing = !!res?.snapshot?.computing && !res?.cycle;
      attempts += 1;
      if (stillComputing && attempts < maxAttempts) {
        timer = setTimeout(tick, 2000);
      } else if (stillComputing) {
        setComputeTimedOut(true);
      }
    };
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const snap = data?.snapshot;
  const cycle = data?.cycle;
  const byTier = useMemo(() => {
    const map: Partial<Record<TierId, TierProgress>> = {};
    for (const tp of snap?.tierProgress ?? []) {
      if (tp.tierId) map[tp.tierId] = tp;
    }
    return map;
  }, [snap?.tierProgress]);

  const pendingApproval = cycle?.status === "REWARD_PENDING_APPROVAL";
  const claimable = pendingApproval && !!cycle?.approvedAt;
  const claimed = cycle?.status === "CLAIMED";

  const currentTierId = useMemo<TierId>(() => {
    if (pendingApproval && cycle?.qualifiedTierId) return cycle.qualifiedTierId;
    const open = TIER_ORDER.find((id) => {
      const tp = byTier[id];
      return tp && !tp.qualified && tp.windowOpen !== false;
    });
    if (open) return open;
    const anyOpen = TIER_ORDER.find((id) => !byTier[id]?.qualified);
    return anyOpen ?? "1CR";
  }, [byTier, cycle?.qualifiedTierId, pendingApproval]);

  useEffect(() => {
    if (!selectedReady && snap?.hasAnchor) {
      setSelectedTierId(currentTierId);
      setSelectedReady(true);
    }
  }, [currentTierId, selectedReady, snap?.hasAnchor]);

  const activeTierId = selectedTierId ?? currentTierId;

  const resolveStatus = useCallback(
    (id: TierId): StageStatus =>
      resolveStageStatus(byTier[id], {
        isCurrent: id === currentTierId,
        pendingApproval,
        claimed,
        qualifiedTierId: cycle?.qualifiedTierId,
      }),
    [byTier, claimed, currentTierId, cycle?.qualifiedTierId, pendingApproval],
  );

  const handleClaim = async () => {
    if (!cycle?._id) return;
    setClaiming(true);
    const res = await claimLuxuryReward(cycle._id);
    if (res?.error) toast.error(res.error);
    else {
      toast.success("Reward claimed — your next cycle starts fresh.");
      await load();
    }
    setClaiming(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white p-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
        <p className="mt-3 text-sm font-bold text-slate-500">Loading your Luxury Path…</p>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="font-black text-rose-800">Couldn’t load Luxury Path</p>
        <p className="mt-1 text-sm text-rose-700">{data.error}</p>
        <Button
          type="button"
          onClick={() => load()}
          className="mt-4 rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#a81831]"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (snap?.computing && !snap?.hasAnchor) {
    if (computeTimedOut) {
      return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 text-center shadow-sm">
          <p className="font-black text-[#0F172A]">Taking longer than usual</p>
          <p className="mt-2 text-sm text-slate-600">
            Retry, or activate a new-plan package if you haven’t started a cycle yet.
          </p>
          <Button
            type="button"
            onClick={() => load()}
            className="mt-4 rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#a81831]"
          >
            Refresh progress
          </Button>
        </section>
      );
    }
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-slate-200/80 bg-white p-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
        <p className="mt-3 text-sm font-bold text-slate-600">Calculating your progress…</p>
        <p className="mt-1 text-xs text-slate-400">First load can take up to ~30 seconds.</p>
      </div>
    );
  }

  if (!snap?.hasAnchor) {
    return (
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <div
          className="relative h-44 sm:h-56"
          style={{ background: "linear-gradient(160deg, #ECFDF5 0%, #ffffff 50%, #FFF1F4 100%)" }}
        >
          <Image
            src="/rewards/starter-prize.png"
            alt="Luxury Path prize preview"
            fill
            className="object-contain object-center p-6 opacity-95"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#FCA5A5]">
              Luxury Path
            </p>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
              Start your reward journey
            </h2>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-slate-600">
            Activate a <span className="font-bold text-[#0F172A]">new-plan package</span> to open
            your cycle. Then chase four stages on the Reward Road — each with team, direct, and
            active-leg missions.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIER_ORDER.map((id) => (
              <div
                key={id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black text-white"
                  style={{ backgroundColor: TIER_META[id].accent }}
                >
                  {TIER_META[id].stage}
                </span>
                <div>
                  <p className="text-sm font-black text-[#0F172A]">
                    {id} {TIER_META[id].label}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {lakh(TIER_META[id].teamBiz)} team
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const currentMeta = TIER_META[currentTierId];
  const selectedProgress = byTier[activeTierId];
  const days = daysLeft(byTier[currentTierId]?.windowEndsAt);
  const clearedCount = TIER_ORDER.filter((id) => byTier[id]?.qualified).length;

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
        <div
          className="relative px-5 py-5 sm:px-6"
          style={{
            background: `linear-gradient(135deg, ${currentMeta.accentSoft} 0%, #ffffff 55%, #FFF1F4 100%)`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#C41E3A]">
                <Sparkles className="h-3.5 w-3.5" />
                Luxury Rewards
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">
                Stage {currentMeta.stage} · {currentMeta.label}
              </h1>
              <p className="mt-1 max-w-xl text-base font-medium leading-relaxed text-slate-600">
                {pendingApproval
                  ? claimable
                    ? "Approved — claim your reward to start a fresh cycle."
                    : "You’ve cleared this stage. Waiting for company review."
                  : byTier[currentTierId]?.windowOpen === false
                    ? "This stage’s time window has ended."
                    : `Complete the 3 requirements below. ${
                        days !== null ? `${days} day${days === 1 ? "" : "s"} left.` : ""
                      }`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm">
                {clearedCount}/4 stages cleared
              </span>
              {pendingApproval && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700">
                  <Crown className="h-3.5 w-3.5" />
                  {cycle?.qualifiedTierId} pending
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatChip label="Team biz" value={lakh(snap.cappedTeamBusinessINR ?? 0)} />
            <StatChip label="Direct" value={lakh(snap.directBusinessINR ?? 0)} />
            <StatChip label="Active legs" value={`${snap.activeLegsCount ?? 0}`} />
          </div>
        </div>

        {(claimable || pendingApproval) && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            {claimable ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                  <Gift className="mt-0.5 h-5 w-5 text-[#C41E3A]" />
                  <div>
                    <p className="font-black text-[#0F172A]">
                      {cycle?.qualifiedTierId} reward is ready
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      Claiming starts a new empty cycle from today.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={claiming}
                  onClick={handleClaim}
                  className="rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#a81831]"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming…
                    </>
                  ) : (
                    "Claim reward"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm font-semibold text-blue-800">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                Your {cycle?.qualifiedTierId} qualification is under review. We’ll unlock claim once
                approved.
              </div>
            )}
          </div>
        )}
      </header>

      {/* Simple stage list — easy for all ages */}
      <SimpleLuxuryStages
        byTier={byTier}
        currentTierId={currentTierId}
        selectedTierId={activeTierId}
        onSelect={setSelectedTierId}
        resolveStatus={resolveStatus}
        snapTeam={snap.cappedTeamBusinessINR ?? 0}
        snapDirect={snap.directBusinessINR ?? 0}
        snapLegs={snap.activeLegsCount ?? 0}
        missions={
          <StageMissions
            tierId={activeTierId}
            progress={selectedProgress}
            snapTeam={snap.cappedTeamBusinessINR ?? 0}
            snapDirect={snap.directBusinessINR ?? 0}
            snapLegs={snap.activeLegsCount ?? 0}
          />
        }
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Accomplished
          </p>
          {clearedCount === 0 ? (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              No stages cleared yet — finish Stage {currentMeta.stage} missions first.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {TIER_ORDER.filter((id) => byTier[id]?.qualified).map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {id} {TIER_META[id].label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            What&apos;s next
          </p>
          {(() => {
            const nextId =
              TIER_ORDER.find((id) => !byTier[id]?.qualified && id !== currentTierId) ??
              (byTier[currentTierId]?.qualified
                ? TIER_ORDER.find((id) => !byTier[id]?.qualified)
                : currentTierId);
            if (!nextId || (clearedCount === 4 && !pendingApproval)) {
              return (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  You’ve reached the end of this path. Claim when ready, then a fresh cycle begins.
                </p>
              );
            }
            const n = TIER_META[nextId];
            return (
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                <span className="font-black text-[#0F172A]">
                  {nextId} {n.label}
                </span>
                {" — "}
                {lakh(n.teamBiz)} team, {lakh(n.directBiz)} direct, {n.legs} legs, {n.windowDays}{" "}
                days. Prize: {n.prizes}.
              </p>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
