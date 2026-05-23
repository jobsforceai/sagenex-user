"use client";

import MultiplierProgress from "./MultiplierProgress";

type Leg = {
  userId: string;
  fullName?: string;
  monthlyBusiness: number;
};

type Props = {
  earningsMultiplier?: number;
  legDetails?: Leg[];
  kycStatus?: string;
};

const LEG_3X = 150000;
const LEG_4X = 200000;
const NEEDED_4X = 4;
const NEEDED_3X = 3;

const formatCompact = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

function Gauge({ value, max, name, userId }: { value: number; max: number; name: string; userId: string }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const arcPath = "M 12 48 A 38 38 0 0 1 88 48";
  const done = value >= max;
  const color = done ? "#10b981" : pct >= 0.5 ? "#f59e0b" : "#fb923c";
  return (
    <div className="flex flex-col items-center min-w-0">
      <svg viewBox="0 0 100 56" className="w-full max-w-[110px]">
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
          {done ? "✓" : formatCompact(value)}
        </text>
      </svg>
      <p className="mt-0.5 w-full truncate text-center text-xs font-semibold text-slate-700" title={name}>
        {name || userId}
      </p>
      <p className="text-[10px] text-slate-500">
        {done ? "Qualified" : `${Math.round(pct * 100)}% of ${formatCompact(max)}`}
      </p>
    </div>
  );
}

export default function LegGauges({ earningsMultiplier = 2.5, legDetails = [], kycStatus }: Props) {
  const sorted = [...legDetails].sort((a, b) => (b.monthlyBusiness || 0) - (a.monthlyBusiness || 0));
  const at4x = earningsMultiplier >= 4;
  const target = at4x ? null : earningsMultiplier >= 3 ? 4 : 3;
  const threshold = target === 4 ? LEG_4X : LEG_3X;
  const needed = target === 4 ? NEEDED_4X : NEEDED_3X;
  const qualifying = sorted.filter((l) => (l.monthlyBusiness || 0) >= threshold).length;
  const visibleLegs = sorted.slice(0, 4);

  if (sorted.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            {at4x ? "All targets met" : `Path to ${target}x`}
          </p>
          <p className="text-base font-black text-[#0F172A]">
            {at4x ? "You're at maximum (4x)" : `${qualifying} / ${needed} legs at ${formatCompact(threshold)}`}
          </p>
        </div>
        <MultiplierProgress
          earningsMultiplier={earningsMultiplier}
          legDetails={legDetails}
          kycStatus={kycStatus}
          trigger={
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              View details
            </button>
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visibleLegs.map((leg) => (
          <Gauge
            key={leg.userId}
            value={leg.monthlyBusiness || 0}
            max={threshold}
            name={leg.fullName || leg.userId}
            userId={leg.userId}
          />
        ))}
      </div>
      {sorted.length > 4 && (
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Showing top 4 of {sorted.length} legs. Tap View details for the full list.
        </p>
      )}
    </section>
  );
}
