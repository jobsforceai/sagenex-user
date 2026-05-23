"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, Sparkles, Trophy, Target, ArrowRight, Clock } from "lucide-react";
import { getLuxuryProgress } from "@/actions/luxury-rewards";

type TierId = "10L" | "30L" | "50L" | "1CR";

const TIER_META: Record<TierId, { label: string; icon: any; ringColor: string; chipBg: string; chipFg: string }> = {
  "10L": { label: "Starter",  icon: Sparkles, ringColor: "#D97706", chipBg: "bg-amber-50",   chipFg: "text-amber-700"   },
  "30L": { label: "Mid",      icon: Trophy,   ringColor: "#059669", chipBg: "bg-emerald-50", chipFg: "text-emerald-700" },
  "50L": { label: "Elite",    icon: Target,   ringColor: "#0284C7", chipBg: "bg-sky-50",     chipFg: "text-sky-700"     },
  "1CR": { label: "Crown",    icon: Crown,    ringColor: "#C81E4A", chipBg: "bg-rose-50",    chipFg: "text-rose-700"    },
};

const lakh = (n: number) =>
  n >= 10_000_000 ? `₹${(n / 10_000_000).toFixed(2)}Cr`
  : n >= 100_000  ? `₹${(n / 100_000).toFixed(2)}L`
  : n >= 1_000    ? `₹${(n / 1_000).toFixed(1)}K`
  : `₹${Math.round(n).toLocaleString("en-IN")}`;

function daysLeft(endsAt: string | Date | null | undefined): number | null {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export default function LuxuryPathSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLuxuryProgress();
        if (!res?.error) setData(res);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Luxury Path</p>
        <p className="mt-2 text-sm text-slate-400">Loading your luxury rewards…</p>
      </section>
    );
  }

  const snap = data?.snapshot;
  const cycle = data?.cycle;

  // No cycle yet — small CTA card
  if (!snap?.hasAnchor) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-[#FFF7ED] via-white to-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#C81E4A]">Luxury Path</p>
            <h3 className="mt-1 text-base font-black text-[#0F172A] sm:text-lg">Unlock your first tier</h3>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Make your first new-plan deposit to start the 120-day cycle.</p>
          </div>
          <Crown className="h-8 w-8 shrink-0 text-[#C81E4A]" />
        </div>
      </section>
    );
  }

  // Find chasing tier (first unqualified) + its team-biz progress
  const tiers: TierId[] = ["10L", "30L", "50L", "1CR"];
  const progByTier: Record<string, any> = {};
  for (const tp of (snap.tierProgress ?? [])) progByTier[tp.tierId] = tp;
  const qualifiedSet = new Set(tiers.filter(t => progByTier[t]?.qualified));
  const chasing: TierId | null = tiers.find(t => !qualifiedSet.has(t)) ?? null;
  const chasingProg = chasing ? progByTier[chasing] : null;
  const pct = chasing ? Math.min(100, Math.round(chasingProg?.teamBizPct ?? 0)) : 100;

  // Per-tier numbers (from config — kept in sync with backend luxury.rewards.ts)
  const TIER_REQ: Record<TierId, { teamBiz: number; directBiz: number; legs: number }> = {
    "10L": { teamBiz:  1_000_000, directBiz:  50_000, legs: 2 },
    "30L": { teamBiz:  3_000_000, directBiz: 150_000, legs: 3 },
    "50L": { teamBiz:  5_000_000, directBiz: 250_000, legs: 4 },
    "1CR": { teamBiz: 10_000_000, directBiz: 500_000, legs: 5 },
  };

  const meta = chasing ? TIER_META[chasing] : TIER_META["1CR"];
  const dLeft = daysLeft(cycle?.cycleEndsAt);
  const Icon = meta.icon;

  // SVG circle math
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Luxury Path</p>
          {chasing && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${meta.chipBg} ${meta.chipFg}`}>
              <Icon className="h-3 w-3" /> Chasing {chasing} {meta.label}
            </span>
          )}
          {!chasing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
              All tiers ✓
            </span>
          )}
        </div>
        <Link
          href="/rewards/luxury"
          className="hidden items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1.5 text-xs font-bold !text-white hover:bg-[#1e293b] sm:inline-flex"
        >
          View full progress <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        {/* Speedometer-style ring */}
        <div className="relative mx-auto h-32 w-32 shrink-0 sm:mx-0">
          <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="9" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={meta.ringColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#0F172A]">{pct}%</span>
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#64748B]">
              {chasing ? `to ${chasing}` : "complete"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
          <Stat
            label="Team biz"
            value={lakh(snap.cappedTeamBusinessINR ?? 0)}
            sub={chasing ? `/ ${lakh(TIER_REQ[chasing].teamBiz)}` : ""}
            ok={chasing ? (snap.cappedTeamBusinessINR ?? 0) >= TIER_REQ[chasing].teamBiz : true}
          />
          <Stat
            label="Direct biz"
            value={lakh(snap.directBusinessINR ?? 0)}
            sub={chasing ? `/ ${lakh(TIER_REQ[chasing].directBiz)}` : ""}
            ok={chasing ? (snap.directBusinessINR ?? 0) >= TIER_REQ[chasing].directBiz : true}
          />
          <Stat
            label="Active legs"
            value={String(snap.activeLegsCount ?? 0)}
            sub={chasing ? `/ ${TIER_REQ[chasing].legs}` : ""}
            ok={chasing ? (snap.activeLegsCount ?? 0) >= TIER_REQ[chasing].legs : true}
          />
        </div>
      </div>

      {/* Cycle clock + mobile CTA */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
          <Clock className="h-3 w-3" />
          {dLeft == null
            ? "No deadline"
            : dLeft < 0
              ? <span className="text-rose-700">Cycle expired</span>
              : dLeft <= 7
                ? <span className="text-amber-700">{dLeft} days left ⚠</span>
                : <>{dLeft} days left</>}
        </div>
        <Link
          href="/rewards/luxury"
          className="inline-flex items-center gap-1 rounded-full bg-[#C8103E] px-3 py-1.5 text-xs font-bold !text-white hover:bg-[#a00d33] sm:hidden"
        >
          View full progress <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-2 text-center sm:p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-[#64748B]">{label}</p>
      <p className={`mt-1 truncate text-sm font-black sm:text-base ${ok ? "text-emerald-700" : "text-[#0F172A]"}`}>{value}</p>
      {sub && <p className="text-[9px] font-bold text-slate-400">{sub}</p>}
    </div>
  );
}
