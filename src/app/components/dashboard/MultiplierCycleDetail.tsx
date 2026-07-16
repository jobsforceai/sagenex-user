"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
} from "lucide-react";
import { getMultiplierProgress } from "@/actions/user";

export type MultiplierTierReq = {
  current: number | boolean;
  required: number | boolean;
  missing: number | boolean;
  perLegBusinessRequired?: number;
};

export type MultiplierTier = {
  multiplier: 2.5 | 3 | 4;
  label: string;
  qualified: boolean;
  progressPct: number;
  requirements: {
    activePackage?: MultiplierTierReq;
    kyc?: MultiplierTierReq;
    qualifyingLegs?: MultiplierTierReq & { perLegBusinessRequired?: number };
    teamBusiness?: MultiplierTierReq;
  };
  blockers: string[];
};

export type MultiplierLeg = {
  userId: string;
  fancyId?: string | null;
  fullName: string;
  business: number;
  qualifies3x: boolean;
  qualifies4x: boolean;
};

export type MultiplierProgressData = {
  storedMultiplier: number;
  projectedNextMultiplier: 2.5 | 3 | 4;
  isPackageActive: boolean;
  isKycVerified: boolean;
  cycle: { start: string; end: string; asOf: string };
  teamBusiness: { raw: number; capped: number };
  qualifyingLegs: { for3x: number; for4x: number };
  tiers: MultiplierTier[];
  legs: MultiplierLeg[];
  error?: string;
};

export const formatCompactInr = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

export const formatFullInr = (n: number) =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;

export const formatCycleDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export function useMultiplierProgress() {
  const [data, setData] = useState<MultiplierProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMultiplierProgress();
        if (cancelled) return;
        if (res?.error) {
          setError(res.error);
        } else {
          setData(res as MultiplierProgressData);
        }
      } catch {
        if (!cancelled) setError("Could not load multiplier progress.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

/** Full 30-day multiplier path for My Business */
export default function MultiplierCycleDetail() {
  const { data, loading, error } = useMultiplierProgress();

  if (loading) {
    return (
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your 30-day multiplier path…
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
        {error || "Multiplier progress is unavailable right now."}
      </section>
    );
  }

  return <MultiplierCycleDetailBody data={data} />;
}

function MultiplierCycleDetailBody({ data }: { data: MultiplierProgressData }) {
  const {
    storedMultiplier,
    projectedNextMultiplier,
    cycle,
    tiers,
    legs,
    teamBusiness,
  } = data;

  const atMax = projectedNextMultiplier >= 4 && storedMultiplier >= 4;
  const atRisk =
    !atMax && projectedNextMultiplier < storedMultiplier;
  const climbing =
    !atMax && projectedNextMultiplier > storedMultiplier;

  const focusMultiplier =
    tiers.find((t) => !t.qualified)?.multiplier ??
    (projectedNextMultiplier > storedMultiplier
      ? projectedNextMultiplier
      : storedMultiplier);

  const focusTier =
    tiers.find((t) => t.multiplier === focusMultiplier) ??
    tiers[tiers.length - 1];

  const [selected, setSelected] = useState(focusTier?.multiplier ?? 3);
  const selectedTier = tiers.find((t) => t.multiplier === selected) ?? focusTier;

  const legThreshold =
    selectedTier?.requirements?.qualifyingLegs?.perLegBusinessRequired ??
    (selected >= 4 ? 200000 : 150000);

  const visibleLegs = legs.slice(0, 8);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-[#FFF1F4] to-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C8103E]">
            30-day multiplier check
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Active on your account today
              </p>
              <p className="mt-1 text-2xl font-black text-[#C8103E]">
                {storedMultiplier}x
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                What you are earning with right now
              </p>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 ${
                atRisk
                  ? "border-amber-200 bg-amber-50"
                  : climbing || atMax
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                This cycle so far
              </p>
              <p
                className={`mt-1 text-2xl font-black ${
                  atRisk ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {projectedNextMultiplier}x
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {atMax
                  ? "You already meet the full 4x checklist"
                  : atRisk
                    ? "If the cycle ended today, you would only lock this"
                    : climbing
                      ? "You are ahead of your current rate"
                      : "Matches what you already have"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm text-[#64748B]">
            Cycle window: {formatCycleDate(cycle.start)} → {formatCycleDate(cycle.end)}
          </p>

          {atRisk && (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-900">
              You still earn at <strong>{storedMultiplier}x</strong> today. To keep it
              after this cycle, finish the checklist below (start with{" "}
              {focusTier?.label ?? "the next step"}).
            </p>
          )}
          {climbing && (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900">
              Great progress — this cycle already qualifies higher than your current{" "}
              {storedMultiplier}x. Keep it until the cycle ends.
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 sm:min-w-[180px]">
          <p className="text-xs text-[#64748B]">Team business this cycle</p>
          <p className="mt-1 text-lg font-black text-[#0F172A]">
            {formatCompactInr(teamBusiness.capped)}
            <span className="ml-1 text-xs font-medium text-[#64748B]">capped</span>
          </p>
          {teamBusiness.raw !== teamBusiness.capped && (
            <p className="mt-0.5 text-xs text-[#64748B]">
              Raw total {formatCompactInr(teamBusiness.raw)}
            </p>
          )}
        </div>
      </div>

      <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
        Checklist for this cycle
      </p>
      <ol className="space-y-0">
        {tiers.map((tier, index) => {
          const isLast = index === tiers.length - 1;
          const isSelected = selected === tier.multiplier;
          const isFocus = focusTier?.multiplier === tier.multiplier;
          const done = tier.qualified;
          const statusLabel = done
            ? "Met this cycle"
            : isFocus
              ? "Focus here"
              : "Later";

          return (
            <li key={tier.multiplier} className="relative flex gap-3 pb-3 last:pb-0">
              <div className="relative flex w-8 shrink-0 flex-col items-center">
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isFocus
                        ? "border-[#C41E3A] bg-[#FFF1F4] text-[#C41E3A]"
                        : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isFocus ? (
                    <MapPin className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`absolute top-8 bottom-0 w-0.5 ${
                      done ? "bg-emerald-300" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelected(tier.multiplier)}
                className={`min-w-0 flex-1 rounded-xl border px-3 py-3 text-left transition ${
                  isSelected
                    ? done
                      ? "border-emerald-300 bg-white ring-1 ring-emerald-200"
                      : "border-[#F9C5D0] bg-white ring-1 ring-[#F9C5D0]"
                    : "border-slate-200 bg-white/80 hover:bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-[#0F172A]">{tier.label}</p>
                    {!done && (
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {tier.progressPct}% of this cycle’s requirements done
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      done
                        ? "bg-emerald-100 text-emerald-800"
                        : isFocus
                          ? "bg-[#FFF1F4] text-[#C41E3A]"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3">
                    <TierRequirements tier={tier} />
                    {tier.blockers.length > 0 && (
                      <ul className="space-y-1">
                        {tier.blockers.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2 text-xs font-medium text-amber-800"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 border-t border-slate-200/70 pt-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            Your legs this cycle · each needs {formatCompactInr(legThreshold)} for{" "}
            {selectedTier?.label ?? `${selected}x`}
          </p>
          {legs.length > visibleLegs.length && (
            <span className="text-[11px] font-semibold text-slate-400">
              Showing {visibleLegs.length} of {legs.length}
            </span>
          )}
        </div>

        {visibleLegs.length === 0 ? (
          <p className="rounded-xl bg-white/80 px-3 py-4 text-center text-sm font-semibold text-slate-500">
            Leg business will appear once your direct team is active this cycle.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {visibleLegs.map((leg) => {
              const pct = Math.min(
                100,
                Math.round((leg.business / Math.max(legThreshold, 1)) * 100),
              );
              const done =
                selected >= 4
                  ? leg.qualifies4x
                  : selected >= 3
                    ? leg.qualifies3x
                    : leg.business > 0;
              return (
                <li
                  key={leg.userId}
                  className={`rounded-xl border px-3 py-2.5 ${
                    done
                      ? "border-emerald-200 bg-emerald-50/80"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[#0F172A]">
                      {leg.fullName || leg.userId}
                    </p>
                    <span
                      className={`shrink-0 text-[11px] font-bold ${
                        done ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {done ? "Strong enough" : `${pct}%`}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {formatFullInr(leg.business)}
                    <span className="text-slate-400">
                      {" "}
                      / {formatCompactInr(legThreshold)} needed
                    </span>
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        done ? "bg-emerald-500" : "bg-[#C41E3A]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function TierRequirements({ tier }: { tier: MultiplierTier }) {
  const req = tier.requirements;
  const rows: { label: string; have: string; need: string; ok: boolean }[] = [];

  if (req.activePackage) {
    rows.push({
      label: "Active package",
      have: req.activePackage.current ? "Yes" : "No",
      need: "Yes",
      ok: !req.activePackage.missing,
    });
  }
  if (req.kyc) {
    rows.push({
      label: "KYC verified",
      have: req.kyc.current ? "Yes" : "No",
      need: "Yes",
      ok: !req.kyc.missing,
    });
  }
  if (req.qualifyingLegs) {
    const per = req.qualifyingLegs.perLegBusinessRequired;
    rows.push({
      label: per
        ? `Qualifying legs (≥ ${formatCompactInr(per)} each)`
        : "Qualifying legs",
      have: String(req.qualifyingLegs.current),
      need: String(req.qualifyingLegs.required),
      ok: Number(req.qualifyingLegs.missing) === 0,
    });
  }
  if (req.teamBusiness) {
    rows.push({
      label: "Team business (capped)",
      have: formatCompactInr(Number(req.teamBusiness.current)),
      need: formatCompactInr(Number(req.teamBusiness.required)),
      ok: Number(req.teamBusiness.missing) === 0,
    });
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs font-semibold text-emerald-700">
        Base tier — active package is enough.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
            {row.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
            <span className="truncate font-medium">{row.label}</span>
          </span>
          <span className="shrink-0 font-bold tabular-nums">
            <span className={row.ok ? "text-emerald-600" : "text-amber-600"}>
              {row.have}
            </span>
            <span className="text-slate-400"> / {row.need}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Tiny summary used by the dashboard widget */
export function MultiplierWidgetSummary({
  data,
}: {
  data: MultiplierProgressData;
}) {
  const nextOpen = data.tiers.find((t) => !t.qualified);
  const thingsLeft = nextOpen?.blockers.length ?? 0;
  const atMax =
    data.storedMultiplier >= 4 && data.projectedNextMultiplier >= 4;
  const atRisk =
    !atMax && data.projectedNextMultiplier < data.storedMultiplier;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          30-day cycle · ends {formatCycleDate(data.cycle.end)}
        </p>
        <p className="mt-0.5 text-base font-black text-[#0F172A] md:text-lg">
          {atMax ? (
            <>
              Keeping maximum <span className="text-emerald-600">4x</span>
            </>
          ) : (
            <>
              Active{" "}
              <span className="text-[#C41E3A]">{data.storedMultiplier}x</span>
              <span className="mx-1.5 font-bold text-slate-300">·</span>
              cycle so far{" "}
              <span className={atRisk ? "text-amber-600" : "text-emerald-600"}>
                {data.projectedNextMultiplier}x
              </span>
            </>
          )}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {atMax
            ? "This cycle already meets the full 4x checklist."
            : atRisk
              ? `Still earning ${data.storedMultiplier}x today — finish ${nextOpen?.label ?? "the next step"} to keep it.`
              : thingsLeft > 0
                ? `${thingsLeft} thing${thingsLeft === 1 ? "" : "s"} left for ${nextOpen?.label ?? "next tier"}`
                : `This cycle is on track for ${data.projectedNextMultiplier}x`}
        </p>
      </div>
      <Link
        href="/team-business"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
      >
        My Business <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
