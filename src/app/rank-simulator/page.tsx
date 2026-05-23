"use client";

/**
 * Rank Simulator — interactive "what-if" tool. Leader sees each of their
 * directs as a row with a slider that adds hypothetical 120-day business
 * to that leg. As they drag, the simulator recomputes:
 *   - qualifying legs at the 3x threshold (₹1.5L)
 *   - qualifying legs at the 4x threshold (₹2L)
 *   - total team business (sum across all legs incl. simulated boosts)
 *   - the multiplier they would unlock
 *
 * No backend round-trips after initial load — all math is pure frontend.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, RotateCcw, ArrowLeft, Lock } from "lucide-react";
import { getRankSimulatorState } from "@/actions/user";

interface Direct {
  userId: string;
  fullName: string;
  packageUSD: number;
  isPackageActive: boolean;
  legBusiness120d: number;
}

interface State {
  currentMultiplier: number;
  isKycVerified: boolean;
  thresholds: {
    threeX: { legs: number; legBusiness: number; teamBusiness: number };
    fourX:  { legs: number; legBusiness: number; teamBusiness: number };
  };
  directs: Direct[];
}

const inrCompact = (n: number) => {
  if (n >= 10_000_000) return "₹" + (n / 10_000_000).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 100_000) return "₹" + (n / 100_000).toFixed(2).replace(/\.?0+$/, "") + " L";
  if (n >= 1_000) return "₹" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const maskName = (s: string) => {
  const t = (s || "").trim();
  if (t.length <= 2) return t;
  return t.charAt(0) + "*".repeat(Math.min(5, Math.max(2, t.length - 2))) + t.charAt(t.length - 1);
};

export default function RankSimulatorPage() {
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** per-direct extra 120d business they'd add (in ₹) */
  const [extra, setExtra] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const r = await getRankSimulatorState();
        if (r?.error) { setError(r.error); setData(null); }
        else { setError(null); setData(r); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally { setLoading(false); }
    })();
  }, []);

  const reset = useCallback(() => setExtra({}), []);

  const sim = useMemo(() => {
    if (!data) return null;
    const t3 = data.thresholds.threeX;
    const t4 = data.thresholds.fourX;
    let qualifying3 = 0;
    let qualifying4 = 0;
    let teamBiz = 0;
    const simulatedLegs = data.directs.map((d) => {
      const boost = d.isPackageActive ? (extra[d.userId] ?? 0) : 0;
      const newBiz = d.legBusiness120d + boost;
      if (d.isPackageActive) {
        if (newBiz >= t4.legBusiness) qualifying4 += 1;
        if (newBiz >= t3.legBusiness) qualifying3 += 1;
        teamBiz += newBiz;
      }
      return { ...d, simulatedBiz: newBiz, boost };
    });

    let unlocks: 2.5 | 3 | 4 = 2.5;
    if (qualifying3 >= t3.legs && teamBiz >= t3.teamBusiness) unlocks = 3;
    if (qualifying4 >= t4.legs && teamBiz >= t4.teamBusiness && data.isKycVerified) unlocks = 4;

    // What's the gap to next target?
    const target: 3 | 4 = unlocks < 3 ? 3 : 4;
    const tgt = target === 3 ? t3 : t4;
    const qualifyingForTarget = target === 3 ? qualifying3 : qualifying4;
    const gaps: string[] = [];
    if (qualifyingForTarget < tgt.legs) gaps.push(`${tgt.legs - qualifyingForTarget} more leg(s) above ₹${tgt.legBusiness.toLocaleString("en-IN")}`);
    if (teamBiz < tgt.teamBusiness) gaps.push(`₹${(tgt.teamBusiness - teamBiz).toLocaleString("en-IN")} more total team`);
    if (target === 4 && !data.isKycVerified) gaps.push("Complete KYC");

    return { simulatedLegs, qualifying3, qualifying4, teamBiz, unlocks, target, gaps };
  }, [data, extra]);

  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFC] p-6"><div className="mx-auto max-w-4xl"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="mt-6 h-72 animate-pulse rounded-3xl bg-slate-100" /></div></div>;
  }
  if (error || !data || !sim) {
    return <div className="min-h-screen bg-[#F8FAFC] p-6"><div className="mx-auto max-w-4xl text-sm text-[#64748B]">Simulator unavailable. {error}</div></div>;
  }

  const t = sim.target === 3 ? data.thresholds.threeX : data.thresholds.fourX;
  const totalBoost = Object.values(extra).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#64748B] hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Hero card */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 !text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-white/80">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Rank Simulator
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">What if you could unlock {sim.unlocks === data.currentMultiplier ? "the next tier" : `${sim.unlocks}x today`}?</h1>
              <p className="mt-1.5 text-xs !text-white/65 sm:text-sm">Drag the sliders below to see how much each leg needs to push you to 3x or 4x.</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] !text-white/55">Right now</span>
              <span className="text-3xl font-black sm:text-4xl">{data.currentMultiplier}x</span>
            </div>
          </div>

          {/* Outcome */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] !text-white/60">Qualifying legs ({t.legBusiness >= 200000 ? "4x" : "3x"})</p>
              <p className="mt-1.5 text-xl font-black">{sim.target === 4 ? sim.qualifying4 : sim.qualifying3}/{t.legs}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] !text-white/60">Team business · 120d</p>
              <p className="mt-1.5 text-xl font-black">{inrCompact(sim.teamBiz)} <span className="text-[10px] font-bold !text-white/55">/ {inrCompact(t.teamBusiness)}</span></p>
            </div>
            <div className={`rounded-2xl border p-3 backdrop-blur ${sim.unlocks > data.currentMultiplier ? "border-emerald-300/40 bg-emerald-400/20" : "border-white/15 bg-white/12"}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] !text-white/60">You unlock</p>
              <p className={`mt-1.5 text-xl font-black ${sim.unlocks > data.currentMultiplier ? "text-emerald-200" : ""}`}>
                {sim.unlocks}x
                {sim.unlocks > data.currentMultiplier && <span className="ml-2 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-200">UNLOCKED!</span>}
              </p>
            </div>
          </div>

          {/* Gap pill */}
          {sim.gaps.length > 0 && sim.unlocks < 4 && (
            <div className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-400/15 px-3 py-2 text-xs !text-white/90">
              <span className="font-black">To unlock {sim.target}x you still need:</span>
              <ul className="mt-1 space-y-0.5">
                {sim.gaps.map((g, i) => <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" /><span>{g}</span></li>)}
              </ul>
            </div>
          )}
          {totalBoost > 0 && (
            <p className="mt-3 text-[11px] !text-white/70">You're projecting an extra <span className="font-black !text-white">{inrCompact(totalBoost)}</span> across {Object.values(extra).filter(v => v > 0).length} leg{Object.values(extra).filter(v => v > 0).length === 1 ? "" : "s"} in the next 120 days.</p>
          )}
        </section>

        {/* Sliders */}
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Move the sliders</p>
              <h2 className="mt-1 text-lg font-black text-[#0F172A] sm:text-xl">What if each leg adds more business?</h2>
            </div>
            <TrendingUp className="h-6 w-6 text-[#C8103E]" />
          </div>

          {sim.simulatedLegs.length === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-sm text-[#64748B]">No directs yet — bring in your first referral to start the simulator.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {sim.simulatedLegs.map((d) => {
                const inactive = !d.isPackageActive;
                const qualifies3 = d.simulatedBiz >= data.thresholds.threeX.legBusiness;
                const qualifies4 = d.simulatedBiz >= data.thresholds.fourX.legBusiness;
                const tier = qualifies4 ? "4x" : qualifies3 ? "3x" : "—";
                return (
                  <div key={d.userId} className={`rounded-2xl border p-4 ${inactive ? "border-slate-200 bg-slate-50/50" : qualifies4 ? "border-emerald-200 bg-emerald-50/40" : qualifies3 ? "border-sky-200 bg-sky-50/40" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0F172A]">{maskName(d.fullName)} <span className="text-xs font-bold text-[#64748B]">· {d.userId}</span></p>
                        <p className="mt-0.5 text-[11px] text-[#64748B]">
                          {inactive ? <span className="inline-flex items-center gap-1 font-bold text-slate-500"><Lock className="h-3 w-3" /> Inactive — reactivate to include</span>
                            : <>Current 120d business: <span className="font-black text-[#0F172A]">{inrCompact(d.legBusiness120d)}</span></>}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.05em] ${tier === "4x" ? "bg-emerald-100 text-emerald-700" : tier === "3x" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                        {tier === "—" ? "below 3x" : `${tier} qualifying`}
                      </span>
                    </div>

                    {!inactive && (
                      <>
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={500000}
                            step={5000}
                            value={extra[d.userId] ?? 0}
                            onChange={(e) => setExtra(s => ({ ...s, [d.userId]: Number(e.target.value) }))}
                            className="flex-1 accent-[#C8103E]"
                          />
                          <span className="shrink-0 rounded-lg bg-[#0F172A] px-2.5 py-1 text-[11px] font-black !text-white">+ {inrCompact(extra[d.userId] ?? 0)}</span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-[#64748B]">Drag to add hypothetical business for this leg in the next 120 days. Projected: <span className="font-bold text-[#0F172A]">{inrCompact(d.simulatedBiz)}</span></p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
