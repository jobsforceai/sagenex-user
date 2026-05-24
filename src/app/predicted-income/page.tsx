"use client";

/**
 * Predicted Income Calculator (#7)
 *
 * Pure-client what-if tool. Leader picks:
 *   - how many new direct referrals they expect to add in 30 days
 *   - avg package per new referral (₹)
 *   - how many reinvestments they expect from the existing team
 *   - avg reinvestment amount (₹)
 *
 * Output: projected income across 30 / 90 / 365 days, broken down by
 *   - direct bonus (12% new plan rate on new directs)
 *   - unilevel cascade (L1-L7 — modelled as a single L1 hit since we don't
 *     have a full subtree model; users below ground-floor get less)
 *   - own ROI cycles compounding (uses lib/roi rates)
 *
 * Conservative: skips lifestyle / luxury / SGNX-Gold commissions. Skips
 * cap-locking. Math meant as a motivational floor estimate.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Calculator, TrendingUp } from "lucide-react";
import { getDashboardData } from "@/actions/user";
import {
  getNewTieredROIRate,
  NEW_PLAN_DIRECT_BONUS_PCT,
  NEW_PLAN_UNILEVEL_PCTS,
} from "@/lib/roi";

const inrCompact = (n: number) => {
  if (n >= 10_000_000) return "₹" + (n / 10_000_000).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 100_000) return "₹" + (n / 100_000).toFixed(2).replace(/\.?0+$/, "") + " L";
  if (n >= 1_000) return "₹" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

const inrExact = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function projectIncome(opts: {
  ownPackageUSD: number;
  newRefs: number;
  newRefAvgPackage: number;
  reinvCount: number;
  reinvAvgAmount: number;
  months: number;
}) {
  const { ownPackageUSD, newRefs, newRefAvgPackage, reinvCount, reinvAvgAmount, months } = opts;

  // Direct bonus (12% new plan) — earned in month 1 only per referral
  const directBonusFromNewRefs = newRefs * newRefAvgPackage * NEW_PLAN_DIRECT_BONUS_PCT;

  // Reinvestments: these are L1 unilevel events (existing direct tops up).
  // First reinvestment = 12% direct bonus equivalent on the new amount.
  // To stay conservative, model as 12% direct on reinvestment volume.
  const directBonusFromReinv = reinvCount * reinvAvgAmount * NEW_PLAN_DIRECT_BONUS_PCT;

  // Unilevel: when a new direct's downline activates, you get L1 (8%). We don't
  // have actual downline data so we apply a soft expectation: 30% of new
  // referrals will themselves recruit 1 person at half their own package
  // size over the window. Single L1 commission.
  const downlineRecruits = newRefs * 0.3;
  const unilevelL1 = downlineRecruits * (newRefAvgPackage * 0.5) * NEW_PLAN_UNILEVEL_PCTS[0];

  // Own ROI for `months` months (compounded forward as the package grows from
  // reinvestments). Conservative — use base package only.
  const monthlyRoiRate = getNewTieredROIRate(ownPackageUSD);
  const ownRoi = ownPackageUSD * monthlyRoiRate * months;

  // Cap-aware: total earnings are capped at packageUSD × multiplier. Since we
  // don't have multiplier here, assume 2.5x as a safe floor.
  const expectedCap = ownPackageUSD * 2.5;
  const beforeCap = directBonusFromNewRefs + directBonusFromReinv + unilevelL1 + ownRoi;
  const total = Math.min(beforeCap, expectedCap);

  return {
    directFromRefs: directBonusFromNewRefs,
    directFromReinv: directBonusFromReinv,
    unilevel: unilevelL1,
    ownRoi,
    total,
    cappedAt: beforeCap > expectedCap ? expectedCap : null,
  };
}

export default function PredictedIncomePage() {
  const [pkg, setPkg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // User inputs
  const [newRefs, setNewRefs] = useState(5);
  const [newRefAvgPackage, setNewRefAvgPackage] = useState(50000);
  const [reinvCount, setReinvCount] = useState(2);
  const [reinvAvgAmount, setReinvAvgAmount] = useState(25000);

  useEffect(() => {
    (async () => {
      try {
        const r = await getDashboardData();
        if (r && !r.error) {
          setPkg(r.profile?.packageUSD ?? 0);
        } else {
          setPkg(0);
        }
      } catch { setPkg(0); }
      finally { setLoading(false); }
    })();
  }, []);

  const projections = useMemo(() => {
    if (pkg === null) return null;
    const baseOpts = {
      ownPackageUSD: pkg,
      newRefs,
      newRefAvgPackage,
      reinvCount,
      reinvAvgAmount,
    };
    return {
      m1: projectIncome({ ...baseOpts, months: 1 }),
      m3: projectIncome({ ...baseOpts, months: 3 }),
      m12: projectIncome({ ...baseOpts, months: 12 }),
    };
  }, [pkg, newRefs, newRefAvgPackage, reinvCount, reinvAvgAmount]);

  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFC] p-6"><div className="mx-auto max-w-4xl"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="mt-6 h-72 animate-pulse rounded-3xl bg-slate-100" /></div></div>;
  }

  const monthlyRoi = (pkg ?? 0) * getNewTieredROIRate(pkg ?? 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 !text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] !text-white/80">
                <Calculator className="h-3.5 w-3.5 text-amber-300" /> Predicted Income
              </span>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">See what your next 12 months could look like</h1>
              <p className="mt-1.5 text-xs !text-white/65 sm:text-sm">Conservative estimate based on the current commission table. Not a guarantee.</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] !text-white/55">Your package</span>
              <span className="text-2xl font-black sm:text-3xl">{inrCompact(pkg ?? 0)}</span>
              <span className="text-[10px] !text-white/55">Monthly ROI base ≈ {inrCompact(monthlyRoi)}</span>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C8103E]" />
            <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Your scenario · next 30 days</p>
          </div>
          <h2 className="mt-1 text-lg font-black text-[#0F172A] sm:text-xl">Tell us what you’ll bring in</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="New direct referrals" value={newRefs} setValue={setNewRefs} min={0} max={50} step={1} unit="people" />
            <Input label="Avg package per referral" value={newRefAvgPackage} setValue={setNewRefAvgPackage} min={0} max={1000000} step={5000} unit="₹" formatAsInr />
            <Input label="Reinvestments from existing team" value={reinvCount} setValue={setReinvCount} min={0} max={20} step={1} unit="top-ups" />
            <Input label="Avg reinvestment amount" value={reinvAvgAmount} setValue={setReinvAvgAmount} min={0} max={500000} step={5000} unit="₹" formatAsInr />
          </div>
        </section>

        {/* Projections */}
        {projections && (
          <section className="grid gap-4 sm:grid-cols-3">
            <ProjectionCard label="30 days" projection={projections.m1} accent="text-emerald-700" bg="bg-emerald-50/40" border="border-emerald-100" />
            <ProjectionCard label="90 days" projection={projections.m3} accent="text-sky-700"     bg="bg-sky-50/40"     border="border-sky-100" />
            <ProjectionCard label="12 months" projection={projections.m12} accent="text-amber-700" bg="bg-amber-50/40" border="border-amber-100" />
          </section>
        )}

        {/* Disclaimer */}
        <p className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[11px] text-[#64748B]">
          <span className="font-black text-[#0F172A]">Estimate only.</span> Uses the new-plan commission rates (12% direct, 8/6/4/2/1/0.5% unilevel) and a tiered ROI table. Skips Lifestyle, Luxury, SGNX-Gold and cap-lock specifics. Real outcomes depend on team activity, deposits passing verification, and your earnings cap.
        </p>
      </div>
    </div>
  );
}

function Input({ label, value, setValue, min, max, step, unit, formatAsInr }: {
  label: string; value: number; setValue: (n: number) => void;
  min: number; max: number; step: number; unit: string; formatAsInr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
        <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-[#0F172A]">
          {formatAsInr ? inrCompact(value) : value} {!formatAsInr && <span className="text-[#64748B]">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-3 w-full accent-[#C8103E]"
      />
    </div>
  );
}

function ProjectionCard({ label, projection, accent, bg, border }: {
  label: string;
  projection: ReturnType<typeof projectIncome>;
  accent: string; bg: string; border: string;
}) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
        <TrendingUp className={`h-4 w-4 ${accent}`} />
      </div>
      <p className={`mt-2 text-2xl font-black ${accent}`}>{inrExact(projection.total)}</p>
      <div className="mt-3 space-y-1 text-[11px] text-[#0F172A]">
        <Row label="Direct bonus · new refs" value={projection.directFromRefs} />
        <Row label="Direct bonus · reinvest" value={projection.directFromReinv} />
        <Row label="Unilevel L1 (est.)" value={projection.unilevel} />
        <Row label="Own ROI" value={projection.ownRoi} />
      </div>
      {projection.cappedAt !== null && (
        <p className="mt-3 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">Capped at 2.5× package</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#64748B]">{label}</span>
      <span className="font-bold">{inrExact(value)}</span>
    </div>
  );
}
