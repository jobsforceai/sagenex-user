"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Sparkles } from "lucide-react";
import { getApiV1BaseUrl } from "@/lib/api-base";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Tier = {
  minPackage: number;
  maxPackage: number | null;
  rateMonthly: number;
  label: string;
};

type Plan = {
  name: string;
  tiers: Tier[];
};

type RoiResponse = {
  success: boolean;
  data: {
    old: Plan;
    new: Plan;
  };
};

type PlanKey = "old" | "new";

const MILESTONES = [6, 12, 24, 36];
const DURATIONS: { value: number; label: string }[] = [
  { value: 6, label: "6 mo" },
  { value: 12, label: "1 yr" },
  { value: 24, label: "2 yr" },
  { value: 36, label: "3 yr" },
];

const inr = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

function findTier(tiers: Tier[], amount: number): Tier | null {
  for (const t of tiers) {
    const above = amount >= t.minPackage;
    const below = t.maxPackage === null || amount <= t.maxPackage;
    if (above && below) return t;
  }
  return null;
}

function project(tiers: Tier[], principal: number, months: number) {
  const monthlyRate = findTier(tiers, principal)?.rateMonthly ?? 0;

  // Simple
  const simpleMonthly = principal * monthlyRate;
  const simpleSeries: number[] = [];
  for (let m = 0; m <= months; m++) {
    simpleSeries.push(principal + simpleMonthly * m);
  }

  // Compound — reinvest each month, re-evaluate tier
  const compoundSeries: number[] = [principal];
  let pkg = principal;
  for (let m = 1; m <= months; m++) {
    const r = findTier(tiers, pkg)?.rateMonthly ?? 0;
    pkg = pkg * (1 + r);
    compoundSeries.push(pkg);
  }

  return { simpleSeries, compoundSeries, monthlyRate };
}

export default function ProfitCalculator() {
  const [plans, setPlans] = useState<{ old: Plan; new: Plan } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activePlan, setActivePlan] = useState<PlanKey>("new");
  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(24);

  useEffect(() => {
    let cancelled = false;
    const url = `${getApiV1BaseUrl()}/config/roi-rates`;
    fetch(url)
      .then((r) => r.json())
      .then((j: RoiResponse) => {
        if (cancelled) return;
        if (j?.success && j.data?.old && j.data?.new) {
          setPlans({ old: j.data.old, new: j.data.new });
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTiers = plans ? plans[activePlan].tiers : [];
  const minPackage = activeTiers[0]?.minPackage ?? 0;
  const belowMin = !!plans && amount < minPackage;

  const projection = useMemo(() => {
    if (!plans) return null;
    return project(activeTiers, amount, months);
  }, [plans, activeTiers, amount, months]);

  const tierLabel = useMemo(() => {
    if (!plans) return "";
    return findTier(activeTiers, amount)?.label ?? "—";
  }, [plans, activeTiers, amount]);

  const monthlyRatePct = projection ? (projection.monthlyRate * 100).toFixed(1) : "0.0";

  const chartData = useMemo(() => {
    if (!projection) return [];
    return projection.simpleSeries.map((s, i) => ({
      month: i,
      Simple: Math.round(s),
      Compound: Math.round(projection.compoundSeries[i] ?? s),
    }));
  }, [projection]);

  const simpleTotal = projection ? projection.simpleSeries[months] ?? amount : amount;
  const compoundTotal = projection ? projection.compoundSeries[months] ?? amount : amount;
  const delta = compoundTotal - simpleTotal;

  const isNew = activePlan === "new";

  return (
    <section className="w-full bg-gradient-to-b from-white to-[#F8FAFC] py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 max-w-3xl mx-auto"
        >
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
            Wealth Compounding
          </span>
          <h2 className="mt-3 font-black text-[#0F172A] text-3xl sm:text-4xl md:text-5xl leading-tight">
            Compounding That Creates <span className="text-[#10B981]">Real Wealth</span>
          </h2>
          <p className="mt-4 text-[#64748B] text-base sm:text-lg">
            Small Steps Today, Massive Freedom Tomorrow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] p-6 sm:p-8 md:p-10"
        >
          {/* Plan tabs */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/70">
              {(["old", "new"] as PlanKey[]).map((key) => {
                const active = activePlan === key;
                const isNewKey = key === "new";
                return (
                  <button
                    key={key}
                    onClick={() => setActivePlan(key)}
                    className={`px-5 sm:px-7 py-2.5 rounded-xl text-sm font-black transition-all ${
                      active
                        ? isNewKey
                          ? "bg-[#10B981] text-white shadow-md"
                          : "bg-[#0F172A] text-white shadow-md"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {isNewKey ? "New ROI Plan" : "Old ROI Plan"}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="grid place-items-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#10B981]" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16 text-[#64748B]">
              Unable to load live ROI rates. Please refresh and try again.
            </div>
          )}

          {!loading && !error && plans && (
            <>
              {/* Inputs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl border border-slate-200/70 bg-[#F8FAFC] p-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                      Investment Amount
                    </label>
                    <span className="font-black text-[#0F172A] text-lg">{inr(amount)}</span>
                  </div>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                  <input
                    type="range"
                    min={1000}
                    max={2000000}
                    step={1000}
                    value={Math.min(amount, 2000000)}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={`mt-3 w-full ${isNew ? "accent-[#10B981]" : "accent-[#0F172A]"}`}
                  />
                  <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                    <span>{inr(1000)}</span>
                    <span>{inr(2000000)}+</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-[#F8FAFC] p-5">
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                      Duration
                    </label>
                    <span className="font-black text-[#0F172A] text-lg">{months} months</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map((d) => {
                      const active = months === d.value;
                      return (
                        <button
                          key={d.value}
                          onClick={() => setMonths(d.value)}
                          className={`py-2 rounded-xl text-sm font-black transition-all ${
                            active
                              ? isNew
                                ? "bg-[#10B981] text-white"
                                : "bg-[#0F172A] text-white"
                              : "bg-white border border-slate-200 text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className={`mt-4 w-full ${isNew ? "accent-[#10B981]" : "accent-[#0F172A]"}`}
                  />
                  <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                    <span>1 mo</span>
                    <span>60 mo</span>
                  </div>
                </div>
              </div>

              {/* Resolved tier */}
              <div
                className={`rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border ${
                  belowMin
                    ? "border-amber-200 bg-amber-50"
                    : isNew
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                    {plans[activePlan].name}
                  </div>
                  <div className="mt-1 font-black text-[#0F172A] text-base sm:text-lg">
                    {belowMin ? `Enter at least ${inr(minPackage)} to qualify` : tierLabel}
                  </div>
                </div>
                {!belowMin && (
                  <div className="text-right">
                    <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                      Monthly Rate
                    </div>
                    <div
                      className={`mt-1 font-black text-2xl ${isNew ? "text-[#10B981]" : "text-[#0F172A]"}`}
                    >
                      {monthlyRatePct}%
                    </div>
                  </div>
                )}
              </div>

              {/* Result cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                    Simple ROI Total
                  </div>
                  <div className="mt-2 font-black text-[#0F172A] text-2xl sm:text-3xl">
                    {inr(simpleTotal)}
                  </div>
                  <div className="mt-1 text-sm text-[#64748B]">Withdraw monthly, package stays flat</div>
                </div>
                <div
                  className={`rounded-2xl p-5 border-2 ${
                    isNew ? "border-[#10B981] bg-emerald-50" : "border-[#0F172A] bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Compound ROI Total
                  </div>
                  <div
                    className={`mt-2 font-black text-2xl sm:text-3xl ${
                      isNew ? "text-[#10B981]" : "text-[#0F172A]"
                    }`}
                  >
                    {inr(compoundTotal)}
                  </div>
                  <div className="mt-1 text-sm text-[#64748B]">Reinvest monthly, package compounds</div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
                  <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B] flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Compounding Bonus
                  </div>
                  <div className="mt-2 font-black text-[#0F172A] text-2xl sm:text-3xl">
                    +{inr(Math.max(0, delta))}
                  </div>
                  <div className="mt-1 text-sm text-[#64748B]">Extra wealth from compounding</div>
                </div>
              </div>

              {/* Chart */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                      Wealth Trajectory
                    </div>
                    <div className="font-black text-[#0F172A] text-base">
                      Simple vs Compound · {months} months
                    </div>
                  </div>
                </div>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gradCompound" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isNew ? "#10B981" : "#0F172A"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={isNew ? "#10B981" : "#0F172A"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient id="gradSimple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <YAxis
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        tickFormatter={(v) =>
                          v >= 1e7
                            ? `${(v / 1e7).toFixed(1)}Cr`
                            : v >= 1e5
                              ? `${(v / 1e5).toFixed(1)}L`
                              : `${(v / 1000).toFixed(0)}K`
                        }
                      />
                      <Tooltip
                        formatter={(v: number) => inr(v)}
                        labelFormatter={(l) => `Month ${l}`}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #E2E8F0",
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="Simple"
                        stroke="#94A3B8"
                        strokeWidth={2}
                        fill="url(#gradSimple)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Compound"
                        stroke={isNew ? "#10B981" : "#0F172A"}
                        strokeWidth={2.5}
                        fill="url(#gradCompound)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Milestone strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {MILESTONES.filter((m) => m <= months && projection).map((m) => {
                  const s = projection!.simpleSeries[m] ?? 0;
                  const c = projection!.compoundSeries[m] ?? 0;
                  const extra = c - s;
                  const label =
                    m === 6 ? "After 6 mo" : m === 12 ? "After 1 yr" : `After ${m / 12} yr`;
                  return (
                    <div
                      key={m}
                      className="rounded-2xl border border-slate-200/70 bg-[#F8FAFC] p-4"
                    >
                      <div className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">
                        {label}
                      </div>
                      <div className="mt-2 text-sm text-[#64748B]">
                        Simple <span className="font-black text-[#0F172A]">{inr(s)}</span>
                      </div>
                      <div className="text-sm text-[#64748B]">
                        Compound{" "}
                        <span
                          className={`font-black ${isNew ? "text-[#10B981]" : "text-[#0F172A]"}`}
                        >
                          {inr(c)}
                        </span>
                      </div>
                      <div
                        className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-black ${
                          isNew ? "bg-emerald-100 text-[#10B981]" : "bg-slate-200 text-[#0F172A]"
                        }`}
                      >
                        +{inr(Math.max(0, extra))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 text-[11px] text-[#94A3B8] text-center">
                Illustrative projection based on current ROI tiers. Past performance is not a
                guarantee of future returns.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
