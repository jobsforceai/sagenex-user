"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  formatCompactInr,
  MultiplierWidgetSummary,
  useMultiplierProgress,
  type MultiplierProgressData,
} from "./MultiplierCycleDetail";

type LegFallback = {
  userId: string;
  fullName?: string;
  monthlyBusiness: number;
};

type Props = {
  earningsMultiplier?: number;
  legDetails?: LegFallback[];
  kycStatus?: string;
};

const LEG_3X = 150000;
const LEG_4X = 200000;
const SHOW_LEGS = 4;

function Gauge({
  value,
  max,
  name,
}: {
  value: number;
  max: number;
  name: string;
}) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const arcPath = "M 12 48 A 38 38 0 0 1 88 48";
  const done = value >= max;
  const color = done ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#fb923c";
  return (
    <div className="flex min-w-0 flex-col items-center">
      <svg viewBox="0 0 100 56" className="w-full max-w-[88px] md:max-w-[110px]">
        <path
          d={arcPath}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={100}
        />
        {pct > 0 && (
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${pct * 100} 100`}
          />
        )}
        <text
          x="50"
          y="42"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          fill={done ? "#10b981" : "#0F172A"}
        >
          {done ? "✓" : formatCompactInr(value)}
        </text>
      </svg>
      <p className="mt-0.5 w-full truncate text-center text-xs font-semibold text-slate-700" title={name}>
        {name}
      </p>
      <p className="text-center text-[9px] leading-tight text-slate-500 md:text-[10px]">
        {done ? "Qualified" : `${Math.round(pct * 100)}% of ${formatCompactInr(max)}`}
      </p>
    </div>
  );
}

function resolveThreshold(data: MultiplierProgressData | null, fallbackMultiplier: number) {
  if (data) {
    const nextOpen = data.tiers.find((t) => !t.qualified);
    const perLeg = nextOpen?.requirements?.qualifyingLegs?.perLegBusinessRequired;
    if (perLeg) return perLeg;
    if (data.projectedNextMultiplier >= 4 || data.storedMultiplier >= 4) return LEG_4X;
    return LEG_3X;
  }
  if (fallbackMultiplier >= 3) return LEG_4X;
  return LEG_3X;
}

/** Dashboard widget: multiplier strip + top 4 leg gauges. Full path on My Business. */
export default function LegGauges({
  earningsMultiplier = 2.5,
  legDetails = [],
}: Props) {
  const { data, loading, error } = useMultiplierProgress();
  const threshold = resolveThreshold(data, earningsMultiplier);

  const apiLegs =
    data?.legs.map((l) => ({
      userId: l.userId,
      fullName: l.fullName,
      monthlyBusiness: l.business,
    })) ?? [];

  const source = apiLegs.length > 0 ? apiLegs : [...legDetails].sort(
    (a, b) => (b.monthlyBusiness || 0) - (a.monthlyBusiness || 0),
  );
  const visibleLegs = source.slice(0, SHOW_LEGS);

  return (
    <section className="rounded-[22px] border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:rounded-3xl md:p-4">
      {loading && !data ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading multiplier…
        </div>
      ) : data ? (
        <MultiplierWidgetSummary data={data} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Earnings multiplier
            </p>
            <p className="mt-0.5 text-base font-black text-[#0F172A]">
              {earningsMultiplier}x active
            </p>
            {error && (
              <p className="mt-0.5 text-xs text-slate-500">
                Open My Business for full 30-day progress.
              </p>
            )}
          </div>
          <Link
            href="/team-business"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            My Business <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div
          className="grid gap-2 md:gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, Math.min(visibleLegs.length || 1, SHOW_LEGS))}, minmax(0, 1fr))`,
          }}
        >
          {visibleLegs.length > 0 ? (
            visibleLegs.map((leg) => (
              <Gauge
                key={leg.userId}
                value={leg.monthlyBusiness || 0}
                max={threshold}
                name={leg.fullName || leg.userId}
              />
            ))
          ) : (
            <p className="rounded-2xl bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
              Leg business will appear once direct team activity is available.
            </p>
          )}
        </div>
        {source.length > visibleLegs.length && (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Showing top {visibleLegs.length} of {source.length} legs.{" "}
            <Link href="/team-business" className="font-bold text-[#C41E3A] hover:underline">
              My Business
            </Link>{" "}
            for the full list.
          </p>
        )}
      </div>
    </section>
  );
}
