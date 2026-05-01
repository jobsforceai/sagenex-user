"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  getRankProgress,
  getDashboardData,
  getReferralSummary,
  getLeaderboard,
  getKycStatus,
} from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Crown,
  Info,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface LegDetail {
  userId: string;
  monthlyBusiness: number;
  activeTeam: number;
}

interface AchieverBonus {
  direct3X: number;
  direct4X: number;
  base3X: number;
  extra3X: number;
  extra4X: number;
  projectedBonus: number;
}

interface RankSnapshot {
  name: string;
  badge?: string;
  salary?: number;
  achievedAt?: string | null;
  consecutiveMonthsMissed?: number;
}

interface RankProgress {
  rank: RankSnapshot;
  performanceRank: RankSnapshot;
  salaryEligibility: {
    isEligible: boolean;
    requirements?: unknown;
  };
  progress: {
    nextRankName?: string | null;
    requirements?: unknown;
  };
  legDetails: LegDetail[];
  achieverBonus: AchieverBonus | null;
}

interface DashboardLike {
  profile?: {
    fullName?: string;
    earningsMultiplier?: number;
    earningsMultiplierDeadline?: string | null;
    earningsMultiplierFloor?: number;
  };
  earningsMultiplier?: number;
  earningsMultiplierDeadline?: string | null;
}

interface ReferralSummary {
  totalDownlineCount?: number;
  activeDownlineCount?: number;
  inactiveDownlineCount?: number;
  totalDownlineVolume?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  fullName: string;
  packagesSold: number;
  earnings: number;
}

// ─── Constants (public business rules) ─────────────────────────────

const LEG_3X_THRESHOLD = 150_000;
const LEG_4X_THRESHOLD = 200_000;
const TEAM_3X_THRESHOLD = 500_000;
const TEAM_4X_THRESHOLD = 1_000_000;
const LEG_CAP_PCT = 0.5;

// ─── Helpers ────────────────────────────────────────────────────────

const formatCurrency = (amount?: number) =>
  (amount ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const formatCurrencyCompact = (amount?: number) => {
  const n = amount ?? 0;
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)} K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const maskName = (value?: string) => {
  if (!value) return "—";
  const clean = value.trim();
  if (clean.length <= 2) return clean;
  return `${clean.charAt(0)}${"*".repeat(Math.min(5, Math.max(2, clean.length - 2)))}${clean.charAt(clean.length - 1)}`;
};

const computeCappedTeam = (legs: LegDetail[]) => {
  const raw = legs.reduce((sum, l) => sum + (l.monthlyBusiness || 0), 0);
  if (raw <= 0) return { raw, capped: 0, cap: 0 };
  const cap = raw * LEG_CAP_PCT;
  const capped = legs.reduce(
    (sum, l) => sum + Math.min(l.monthlyBusiness || 0, cap),
    0,
  );
  return { raw, capped, cap };
};

const legTier = (monthly: number): "4x" | "3x" | "none" => {
  if (monthly >= LEG_4X_THRESHOLD) return "4x";
  if (monthly >= LEG_3X_THRESHOLD) return "3x";
  return "none";
};

// ─── Sub-components ────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  subtitle,
  accent = "text-[#0F172A]",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
}) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <p className="text-sm font-medium text-[#64748B]">{label}</p>
    <p className={`mt-2 text-2xl font-black leading-none sm:text-3xl ${accent}`}>{value}</p>
    {subtitle && <p className="mt-2 text-xs text-[#64748B]">{subtitle}</p>}
  </div>
);

const ChecklistRow = ({
  ok,
  title,
  detail,
}: {
  ok: boolean;
  title: string;
  detail: string;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
    {ok ? (
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
    ) : (
      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C8103E]" />
    )}
    <div className="min-w-0">
      <p className="text-sm font-black text-[#0F172A]">{title}</p>
      <p className="mt-0.5 text-xs text-[#64748B]">{detail}</p>
    </div>
  </div>
);

// ─── Page ──────────────────────────────────────────────────────────

const TeamBusinessPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [dashboard, setDashboard] = useState<DashboardLike | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [kycVerified, setKycVerified] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rp, dash, ref, lb, kyc] = await Promise.all([
        getRankProgress(),
        getDashboardData(),
        getReferralSummary(),
        getLeaderboard("team"),
        getKycStatus(),
      ]);
      if (rp?.error) {
        setError(rp.error);
      } else {
        setRankProgress(rp);
      }
      if (!dash?.error) setDashboard(dash);
      if (!ref?.error) setReferralSummary(ref);
      if (Array.isArray(lb)) setLeaderboard(lb);
      if (kyc && !kyc.error) {
        setKycVerified(kyc?.status === "VERIFIED");
      }
    } catch {
      setError("Failed to load team business data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated, authLoading, router, fetchAll]);

  const legs = useMemo(() => {
    const list = [...(rankProgress?.legDetails ?? [])];
    return list.sort((a, b) => (b.monthlyBusiness || 0) - (a.monthlyBusiness || 0));
  }, [rankProgress]);

  const teamMath = useMemo(() => computeCappedTeam(legs), [legs]);

  const counts = useMemo(() => {
    const legsAt4x = legs.filter((l) => l.monthlyBusiness >= LEG_4X_THRESHOLD).length;
    const legsAt3x = legs.filter((l) => l.monthlyBusiness >= LEG_3X_THRESHOLD).length;
    return { legsAt4x, legsAt3x };
  }, [legs]);

  const earningsMultiplier =
    dashboard?.earningsMultiplier ?? dashboard?.profile?.earningsMultiplier ?? 0;
  const earningsMultiplierFloor = dashboard?.profile?.earningsMultiplierFloor;
  const earningsMultiplierDeadline =
    dashboard?.earningsMultiplierDeadline ?? dashboard?.profile?.earningsMultiplierDeadline ?? null;

  const totalTeam = referralSummary?.totalDownlineCount ?? 0;
  const activeTeam = referralSummary?.activeDownlineCount ?? 0;
  const inactiveTeam =
    referralSummary?.inactiveDownlineCount ??
    Math.max(0, totalTeam - activeTeam);
  const downlineVolume = referralSummary?.totalDownlineVolume ?? 0;

  const qualifies3x =
    counts.legsAt3x >= 3 && teamMath.capped >= TEAM_3X_THRESHOLD;
  const qualifies4x =
    counts.legsAt4x >= 4 && teamMath.capped >= TEAM_4X_THRESHOLD && kycVerified;

  const nextHint = useMemo(() => {
    if (qualifies4x) return "You meet 4x indicators this month. Keep it up.";
    const needLegs = Math.max(0, 4 - counts.legsAt4x);
    const needTeam = Math.max(0, TEAM_4X_THRESHOLD - teamMath.capped);
    const parts: string[] = [];
    if (!kycVerified) parts.push("verify KYC");
    if (needLegs > 0)
      parts.push(`${needLegs} more leg${needLegs === 1 ? "" : "s"} doing ≥ ₹2L`);
    if (needTeam > 0)
      parts.push(`${formatCurrencyCompact(needTeam)} more capped team business`);
    if (parts.length === 0) return "All 4x indicators met — pending official daily computation.";
    return `What you need to reach 4x: ${parts.join(", ")}.`;
  }, [counts.legsAt4x, teamMath.capped, kycVerified, qualifies4x]);

  if (authLoading || loading) {
    return (
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !rankProgress) {
    return (
      <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <AlertCircle className="mx-auto h-10 w-10 text-[#C8103E]" />
          <p className="mt-3 text-lg font-black text-red-700">Unable to load business data</p>
          <p className="mt-2 text-sm text-red-600">{error || "Try again in a moment."}</p>
          <Button
            onClick={fetchAll}
            className="wallet-red-control mt-5 bg-[#C8103E] text-white hover:bg-[#A90D32]"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C8103E]">
              Team Performance &amp; Multiplier Status
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">
              My Business
            </h1>
            <p className="mt-1 text-sm text-[#64748B] sm:text-base">
              Monthly business and 3x / 4x qualification indicators across your legs.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchAll}
            className="h-11 rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </header>

        {/* Multiplier Status */}
        <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-[#FFF1F4] to-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8103E] text-white shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C8103E]">
                  Multiplier Status
                </p>
                <p className="mt-1 text-2xl font-black text-[#0F172A]">
                  {earningsMultiplier ? `${earningsMultiplier}x active` : "No multiplier"}
                </p>
                {earningsMultiplierFloor !== undefined && earningsMultiplierFloor > 0 && (
                  <p className="text-xs text-[#64748B]">
                    Floor: {earningsMultiplierFloor}x
                  </p>
                )}
                {earningsMultiplierDeadline && (
                  <p className="text-xs text-[#64748B]">
                    Deadline: {new Date(earningsMultiplierDeadline).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
              <p className="text-xs text-[#64748B]">Capped team business (MTD)</p>
              <p className="mt-1 text-lg font-black text-[#0F172A]">
                {formatCurrencyCompact(teamMath.capped)}{" "}
                <span className="text-xs font-medium text-[#64748B]">
                  / {formatCurrencyCompact(TEAM_4X_THRESHOLD)} (4x)
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ChecklistRow
              ok={kycVerified}
              title="KYC verified"
              detail={kycVerified ? "Required for 4x — done" : "Required for 4x"}
            />
            <ChecklistRow
              ok={counts.legsAt3x >= 3}
              title="3 legs ≥ ₹1.5L this month"
              detail={`${counts.legsAt3x} of 3 legs qualifying for 3x`}
            />
            <ChecklistRow
              ok={counts.legsAt4x >= 4}
              title="4 legs ≥ ₹2L this month"
              detail={`${counts.legsAt4x} of 4 legs qualifying for 4x`}
            />
            <ChecklistRow
              ok={teamMath.capped >= TEAM_4X_THRESHOLD}
              title="Capped team ≥ ₹10L"
              detail={`${formatCurrencyCompact(teamMath.capped)} / ${formatCurrencyCompact(TEAM_4X_THRESHOLD)}`}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                qualifies3x
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-[#64748B]"
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              3x indicators {qualifies3x ? "met" : "not met"}
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                qualifies4x
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-[#64748B]"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              4x indicators {qualifies4x ? "met" : "not met"}
            </span>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/70 p-3 text-xs text-[#64748B]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#C8103E]" />
            <span>
              {nextHint} Numbers below are <strong>month-to-date</strong>. Your multiplier is
              computed daily by the system on a rolling 30-day window — these tables are an
              indicator, not the official qualification.
            </span>
          </p>
        </section>

        {/* Hero metrics */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Downline"
            value={totalTeam.toLocaleString("en-IN")}
            subtitle="All members under you"
          />
          <StatCard
            label="Active Downline"
            value={activeTeam.toLocaleString("en-IN")}
            subtitle="With active package"
            accent="text-emerald-600"
          />
          <StatCard
            label="Inactive Downline"
            value={inactiveTeam.toLocaleString("en-IN")}
            subtitle="Without active package"
          />
          <StatCard
            label="Downline Volume"
            value={formatCurrencyCompact(downlineVolume)}
            subtitle="Lifetime total"
          />
        </section>

        {/* Rank + salary block */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748B]">
              Current Rank
            </p>
            <p className="mt-2 text-2xl font-black text-[#0F172A]">
              {rankProgress.rank?.name ?? "—"}
            </p>
            {rankProgress.progress?.nextRankName && (
              <p className="mt-1 text-sm text-[#64748B]">
                Next: <span className="font-bold text-[#0F172A]">{rankProgress.progress.nextRankName}</span>
              </p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748B]">
              Salary Eligibility
            </p>
            <p
              className={`mt-2 text-2xl font-black ${
                rankProgress.salaryEligibility?.isEligible
                  ? "text-emerald-600"
                  : "text-[#0F172A]"
              }`}
            >
              {rankProgress.salaryEligibility?.isEligible ? "Eligible" : "Not eligible"}
            </p>
            <p className="mt-1 text-sm text-[#64748B]">
              Performance rank salary:{" "}
              <span className="font-bold text-[#0F172A]">
                {formatCurrency(rankProgress.performanceRank?.salary)}
              </span>
            </p>
          </div>
        </section>

        {/* Leg-by-leg table */}
        <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#0F172A]">Leg-by-Leg Business</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Month-to-date business per direct leg, sorted high → low.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> 4x leg ≥ ₹2L
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> 3x leg ≥ ₹1.5L
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[#64748B]">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Below 3x
              </span>
            </div>
          </div>

          {legs.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-[#64748B]">
              No leg business recorded this month yet.
            </p>
          ) : (
            <>
              {/* Desktop */}
              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.08em] text-[#64748B]">
                      <th className="px-3 py-3 text-left">Leg / User ID</th>
                      <th className="px-3 py-3 text-right">Monthly Business</th>
                      <th className="px-3 py-3 text-right">Active Team</th>
                      <th className="px-3 py-3 text-right">Status</th>
                      <th className="px-3 py-3 text-right">3x / 4x</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {legs.map((leg) => {
                      const tier = legTier(leg.monthlyBusiness || 0);
                      return (
                        <tr key={leg.userId}>
                          <td className="px-3 py-4 font-black text-[#0F172A]">{leg.userId}</td>
                          <td className="px-3 py-4 text-right font-bold text-[#0F172A]">
                            {formatCurrency(leg.monthlyBusiness)}
                          </td>
                          <td className="px-3 py-4 text-right text-[#64748B]">
                            {(leg.activeTeam ?? 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-4 text-right">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                          <td className="px-3 py-4 text-right">
                            {tier === "4x" && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 4x leg
                              </span>
                            )}
                            {tier === "3x" && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 3x leg
                              </span>
                            )}
                            {tier === "none" && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#64748B]">
                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                Below 3x
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="mt-5 grid gap-3 md:hidden">
                {legs.map((leg) => {
                  const tier = legTier(leg.monthlyBusiness || 0);
                  return (
                    <div
                      key={leg.userId}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-[#0F172A]">{leg.userId}</p>
                        {tier === "4x" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">
                            4x leg
                          </span>
                        )}
                        {tier === "3x" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                            3x leg
                          </span>
                        )}
                        {tier === "none" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-[#64748B]">
                            Below 3x
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-[#64748B]">
                        Monthly Business:{" "}
                        <span className="font-bold text-[#0F172A]">
                          {formatCurrency(leg.monthlyBusiness)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-[#64748B]">
                        Active Team:{" "}
                        <span className="font-bold text-[#0F172A]">
                          {(leg.activeTeam ?? 0).toLocaleString("en-IN")}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-[#64748B]">
                <span>
                  Raw team:{" "}
                  <strong className="text-[#0F172A]">
                    {formatCurrencyCompact(teamMath.raw)}
                  </strong>
                </span>
                <span>
                  Per-leg cap (50%):{" "}
                  <strong className="text-[#0F172A]">
                    {formatCurrencyCompact(teamMath.cap)}
                  </strong>
                </span>
                <span>
                  Capped team:{" "}
                  <strong className="text-[#0F172A]">
                    {formatCurrencyCompact(teamMath.capped)}
                  </strong>
                </span>
              </div>
            </>
          )}
        </section>

        {/* Top performers + achiever bonus */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#0F172A]">Top Performers (Team)</h2>
              <Users className="h-4 w-4 text-[#64748B]" />
            </div>
            <div className="mt-4 space-y-3">
              {leaderboard.slice(0, 5).length > 0 ? (
                leaderboard.slice(0, 5).map((p, idx) => (
                  <div
                    key={`${p.userId || p.fullName}-${idx}`}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-[#0F172A]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0F172A]">
                          {maskName(p.fullName)}
                        </p>
                        <p className="text-xs text-[#64748B]">
                          Team: {p.packagesSold.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-black text-emerald-600">
                      +{formatCurrency(p.earnings)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-[#64748B]">
                  Top performers will appear once team activity is available.
                </p>
              )}
            </div>
          </div>

          {rankProgress.achieverBonus ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-[#0F172A]">Achiever Bonus</h2>
                <TrendingUp className="h-4 w-4 text-[#64748B]" />
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["3x Directs", rankProgress.achieverBonus.direct3X, "(incl. 4x)"],
                  ["4x Directs", rankProgress.achieverBonus.direct4X, "counts double"],
                  ["Base Required", rankProgress.achieverBonus.base3X, "minimum base"],
                  [
                    "Projected Bonus",
                    formatCurrency(rankProgress.achieverBonus.projectedBonus),
                    "added to salary",
                  ],
                ].map(([label, value, note]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">
                        {label}
                      </p>
                      <p className="text-xs text-slate-400">{note}</p>
                    </div>
                    <p className="text-base font-black text-[#0F172A]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center rounded-3xl border border-dashed border-slate-200 bg-white/40 p-6 text-center text-sm text-[#64748B]">
              <p className="font-bold text-[#0F172A]">Achiever bonus not active</p>
              <p className="mt-1">
                Maintain 3x / 4x indicators to unlock the achiever bonus.
              </p>
            </div>
          )}
        </section>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#64748B]">
          <span className="inline-flex items-center gap-2">
            <Info className="h-4 w-4 text-[#C8103E]" />
            Want the full team tree and bonus rules?
          </span>
          <Button
            variant="outline"
            onClick={() => router.push("/team")}
            className="h-10 rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
          >
            Open My Team <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamBusinessPage;
