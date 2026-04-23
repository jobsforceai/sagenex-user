"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRankProgress } from "@/actions/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Trophy, Info, TrendingUp, Zap, RefreshCw } from "lucide-react";

interface RankProgress {
  rank: {
    name: string;
    badge: string;
    achievedAt: string | null;
    consecutiveMonthsMissed: number;
  };
  performanceRank: {
    name: string;
    badge: string;
    salary: number;
  };
  salaryEligibility: {
    isEligible: boolean;
    requirements?: {
      directs?: { current: number; required: number };
      requiresActivePackage?: { current: boolean; required: true };
      direct3X?: { current: number; required: number };
      orCondition?: {
        direct3X: { current: number; required: number };
        direct4X: { current: number; required: number };
      };
    };
  };
  progress: {
    nextRankName?: string | null;
    requirements?: {
      directs?: { current: number; required: number };
      requiresActivePackage?: { current: boolean; required: true };
      direct3X?: { current: number; required: number };
      orCondition?: {
        direct3X: { current: number; required: number };
        direct4X: { current: number; required: number };
      };
    } | null;
  };
  legDetails: {
    userId: string;
    monthlyBusiness: number;
    activeTeam: number;
  }[];
  achieverBonus: {
    direct3X: number;
    direct4X: number;
    base3X: number;
    extra3X: number;
    extra4X: number;
    projectedBonus: number;
  } | null;
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtK = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

// Mirror of backend ranks — kept in sync with user.service.ts
// Qualification is based on direct 3X/4X achiever counts (earningsMultiplier ≥ 3/4).
// orCondition = the mixed 3X+4X alternative from the official Achiever-Based Salary Program image.
const RANKS = [
  { level: 0, name: "Member", salary: 0, salaryMax: 0, requirements: null, achieverBonus: null },
  {
    level: 1, name: "Starter", salary: 0, salaryMax: 0,
    requirements: { directs: 6, note: "Active package required" },
    achieverBonus: null,
  },
  {
    level: 2, name: "Builder", salary: 30000, salaryMax: 50000,
    requirements: { direct3X: 3, orCondition: { direct3X: 2, direct4X: 1 } },
    achieverBonus: { base3X: 3, orConditionLabel: "2×3X + 1×4X", extra3X: 4500, extra4X: 9000 },
  },
  {
    level: 3, name: "Leader", salary: 80000, salaryMax: 120000,
    requirements: { direct3X: 6, orCondition: { direct3X: 4, direct4X: 1 } },
    achieverBonus: { base3X: 6, orConditionLabel: "4×3X + 1×4X", extra3X: 6750, extra4X: 13500 },
  },
  {
    level: 4, name: "Manager", salary: 180000, salaryMax: 250000,
    requirements: { direct3X: 12, orCondition: { direct3X: 8, direct4X: 2 } },
    achieverBonus: { base3X: 12, orConditionLabel: "8×3X + 2×4X", extra3X: 9000, extra4X: 18000 },
  },
  {
    level: 5, name: "Director", salary: 350000, salaryMax: 500000,
    requirements: { direct3X: 20, orCondition: { direct3X: 12, direct4X: 4 } },
    achieverBonus: { base3X: 20, orConditionLabel: "12×3X + 4×4X", extra3X: 13500, extra4X: 27000 },
  },
  {
    level: 6, name: "Elite Director", salary: 600000, salaryMax: 1000000,
    requirements: { direct3X: 35, orCondition: { direct3X: 20, direct4X: 6 } },
    achieverBonus: { base3X: 35, orConditionLabel: "20×3X + 6×4X", extra3X: 18000, extra4X: 36000 },
  },
  {
    level: 7, name: "Crown Elite", salary: 1200000, salaryMax: 1200000,
    requirements: { direct3X: 60, orCondition: { direct3X: 30, direct4X: 10 } },
    achieverBonus: { base3X: 60, orConditionLabel: "30×3X + 10×4X", extra3X: 0, extra4X: 0, isSpecial: true },
  },
];

const RANK_COLORS: Record<string, string> = {
  Member: "text-[#111827]",
  Starter: "text-[#111827]",
  Builder: "text-[#111827]",
  Leader: "text-[#111827]",
  Manager: "text-[#111827]",
  Director: "text-[#111827]",
  "Elite Director": "text-[#111827]",
  "Crown Elite": "text-[#111827]",
};

const RANK_BG: Record<string, string> = {
  Member: "border-[#E8E8E8] bg-white",
  Starter: "border-[#E8E8E8] bg-white",
  Builder: "border-[#E8E8E8] bg-white",
  Leader: "border-[#E8E8E8] bg-white",
  Manager: "border-[#E8E8E8] bg-white",
  Director: "border-[#E8E8E8] bg-white",
  "Elite Director": "border-[#E8E8E8] bg-white",
  "Crown Elite": "border-[#E8E8E8] bg-white",
};

const SalaryPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const diff = endOfMonth.getTime() - now.getTime();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalTime = endOfMonth.getTime() - startOfMonth.getTime();
      setProgressPercentage(((now.getTime() - startOfMonth.getTime()) / totalTime) * 100);
      if (diff <= 0) { setCountdown("Processing..."); clearInterval(timer); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) { router.push("/login"); return; }
    if (!token) return;

    const fetchRankProgress = async () => {
      setDataLoading(true);
      try {
        const res = await getRankProgress();
        if (res.error) setError(res.error);
        else setRankProgress(res);
      } catch {
        setError("An unexpected error occurred while fetching rank progress.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchRankProgress();
  }, [token, isAuthenticated, loading, router]);

  const renderBar = (current: number, required: number, label: string, isCurrency = false) => {
    const pct = required > 0 ? Math.min((current / required) * 100, 100) : 100;
    const fv = (v: number) => isCurrency ? fmt(v) : v.toLocaleString("en-IN");
    return (
      <div>
        <div className="mb-1 flex justify-between text-sm text-zinc-600">
          <span>{label}</span>
          <span className="font-semibold">{fv(current)} / {fv(required)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100">
          <div className="h-2 rounded-full bg-[#C41E3A] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  if (loading || dataLoading) {
    return (
      <>
        <main className="dashboard-light-scope p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="dashboard-light-scope min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </>
    );
  }

  const { rank, performanceRank, salaryEligibility, progress } = rankProgress!;
  const rankDef = RANKS.find(r => r.name === performanceRank.name);
  const salaryMax = rankDef?.salaryMax ?? performanceRank.salary;
  const graceMultiplier = rank.consecutiveMonthsMissed === 1 ? 0.5 : 1;

  return (
    <>
      <main className="dashboard-light-scope p-6 space-y-6">
        <div className="flex flex-col gap-4 border-b border-[#E8E8E8] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {/* <Button asChild variant="outline" className="inline-flex w-fit border-[#E8E8E8] bg-white text-zinc-600 hover:bg-[#F8F9FA]">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button> */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">Salary</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#111827]">Salary & Rank</h1>
              <p className="mt-1 text-sm text-zinc-500">A clean view of your current rank, payout status, and qualification requirements.</p>
            </div>
          </div>
        </div>

        {/* ─── This Month's Performance ─── */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <Star className="w-5 h-5 text-[#C41E3A]" />This Month's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salaryEligibility.isEligible ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">Eligible Salary</p>
                    <p className="mt-1 text-3xl font-bold text-[#111827]">{performanceRank.name}</p>
                    <p className="mt-1 text-xl font-semibold text-[#C41E3A]">
                      {fmt(Math.round(performanceRank.salary * graceMultiplier))} – {fmt(Math.round(salaryMax * graceMultiplier))}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Base {fmt(performanceRank.salary)} + achiever bonuses up to {fmt(salaryMax)}
                      {graceMultiplier < 1 ? " — 50% grace period applied" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Salary Credits In</p>
                    <p className="mt-1 text-2xl font-bold text-[#111827]">{countdown}</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2">
                  <div className="bg-[#C41E3A] h-2 rounded-full" style={{ width: `${progressPercentage}%` }} />
                </div>
                <p className="text-xs text-zinc-400 text-center">{progressPercentage.toFixed(1)}% of cycle completed</p>
                {rank.consecutiveMonthsMissed === 1 && (
                  <p className="text-sm text-zinc-600 bg-zinc-50 border border-[#E8E8E8] rounded p-2">
                    Grace period active — payout will be 50% of base salary this month.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  You have not yet met this month's performance requirements. Current performance: <strong>{performanceRank.name}</strong>.
                </p>
                {rank.consecutiveMonthsMissed === 1 && (
                  <p className="text-sm text-zinc-600 bg-zinc-50 border border-[#E8E8E8] rounded p-2">
                    Warning: You missed last month's targets. Miss again this month → salary paused.
                  </p>
                )}
                {rank.consecutiveMonthsMissed >= 2 && (
                  <p className="text-sm text-zinc-600 bg-zinc-50 border border-[#E8E8E8] rounded p-2">
                    Salary Paused — 2+ consecutive months missed.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Progress Towards Next Rank ─── */}
        {progress?.nextRankName && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-[#C41E3A]" />
                Progress Towards <span className="ml-1 text-[#111827]">{progress.nextRankName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.requirements ? (
                <>
                  {progress.requirements.directs && renderBar(progress.requirements.directs.current, progress.requirements.directs.required, "Direct Referrals")}
                  {progress.requirements.direct3X && renderBar(progress.requirements.direct3X.current, progress.requirements.direct3X.required, "Direct 3X Achievers")}
                  {progress.requirements.orCondition && (
                    <div className="space-y-3 rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">Or qualify with mixed achievers</p>
                      {renderBar(progress.requirements.orCondition.direct3X.current, progress.requirements.orCondition.direct3X.required, "Pure 3X Achievers")}
                      {renderBar(progress.requirements.orCondition.direct4X.current, progress.requirements.orCondition.direct4X.required, "4X Achievers")}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-zinc-400">No requirements specified.</p>
              )}
            </CardContent>
          </Card>
        )}

        {!progress?.nextRankName && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardContent className="p-6 text-center">
              <Trophy className="mx-auto mb-2 h-10 w-10 text-[#C41E3A]" />
              <p className="text-xl font-semibold">You have reached the highest rank!</p>
            </CardContent>
          </Card>
        )}

        {/* ─── Leg Details ─── */}
        {rankProgress!.legDetails?.length > 0 && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader><CardTitle className="text-lg">Leg Details (This Month)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 text-xs uppercase border-b border-[#E8E8E8]">
                      <th className="px-3 py-2 text-left">Leg (User ID)</th>
                      <th className="px-3 py-2 text-right">Monthly Business</th>
                      <th className="px-3 py-2 text-right">Active Team</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E8]">
                    {rankProgress!.legDetails.map((leg) => (
                      <tr key={leg.userId}>
                        <td className="px-3 py-2 font-medium text-white">{leg.userId}</td>
                        <td className="px-3 py-2 text-right text-zinc-600">{fmt(leg.monthlyBusiness)}</td>
                        <td className="px-3 py-2 text-right text-zinc-600">{leg.activeTeam.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Achiever Bonus (This Month) ─── */}
        {rankProgress!.achieverBonus && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#C41E3A]" />Achiever Bonus — This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const ab = rankProgress!.achieverBonus!;
                const pure3X = ab.direct3X - ab.direct4X;
                const total3xEq = pure3X + ab.direct4X * 2;
                const hasBase = total3xEq >= ab.base3X;
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="bg-[#F8F9FA] rounded p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">3x Directs</p>
                        <p className="text-2xl font-bold text-[#111827]">{ab.direct3X}</p>
                        <p className="text-xs text-zinc-500">(incl. 4x)</p>
                      </div>
                      <div className="bg-[#F8F9FA] rounded p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">4x Directs</p>
                        <p className="text-2xl font-bold text-[#111827]">{ab.direct4X}</p>
                        <p className="text-xs text-zinc-500">counts double</p>
                      </div>
                      <div className="bg-[#F8F9FA] rounded p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">Base Required</p>
                        <p className="text-2xl font-bold text-[#111827]">{ab.base3X}</p>
                        <p className="text-xs text-zinc-500">{hasBase ? "met ✓" : "not met"}</p>
                      </div>
                      <div className="bg-[#F8F9FA] rounded p-3 text-center">
                        <p className="text-xs text-zinc-400 mb-1">Projected Bonus</p>
                        <p className="text-2xl font-bold text-[#C41E3A]">{fmt(ab.projectedBonus)}</p>
                        <p className="text-xs text-zinc-500">added to salary</p>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1 bg-[#F8F9FA] rounded p-3">
                      <p>Each extra <span className="font-medium text-[#111827]">3x direct</span> beyond {ab.base3X} base = <span className="font-semibold text-[#111827]">{fmt(ab.extra3X)}</span></p>
                      <p>Each extra <span className="font-medium text-[#111827]">4x direct</span> beyond base = <span className="font-semibold text-[#111827]">{fmt(ab.extra4X)}</span> (4x counts as 2 base slots)</p>
                      <p className="text-zinc-500 pt-1">Recalculated every month at salary time. 4x directs earn higher rates.</p>
                    </div>

                    {!hasBase && (
                      <p className="text-xs text-zinc-600 bg-zinc-50 border border-[#E8E8E8] rounded p-2">
                        You need {ab.base3X} base 3x-equivalent directs to start earning the achiever bonus. Currently at {total3xEq} ({pure3X} pure 3x + {ab.direct4X} 4x × 2).
                      </p>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────── */}
        {/* ─── FULL RANK & RULES REFERENCE ─────────────────────── */}
        {/* ─────────────────────────────────────────────────────── */}

        <div className="pt-4 border-t border-[#E8E8E8]">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-zinc-400" />
            <h2 className="text-xl font-bold">Rank Qualification Rules</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            Requirements are evaluated every month. You must meet all criteria in the current calendar month to earn your rank's salary. Missing for 1 month triggers a 50% grace payout; missing 2+ months pauses your salary.
          </p>

          {/* Rank cards */}
          <div className="space-y-3">
            {RANKS.filter((r) => r.salary > 0 || r.level === 1).map((r) => {
              const isCurrentRank = r.name === rank.name;
              const isPerformanceRank = r.name === performanceRank.name;
              return (
                <div
                  key={r.name}
                  className={`rounded-xl border p-4 ${RANK_BG[r.name] ?? "border-[#E8E8E8] bg-zinc-50"} ${isCurrentRank ? "ring-2 ring-[#C41E3A]/20" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${RANK_COLORS[r.name] ?? "text-[#111827]"}`}>{r.name}</span>
                      {isCurrentRank && <Badge variant="outline" className="text-xs border-[#E8E8E8] text-zinc-600">Your Rank</Badge>}
                      {isPerformanceRank && !isCurrentRank && <Badge variant="outline" className="text-xs border-[#E8E8E8] text-zinc-600">This Month</Badge>}
                    </div>
                    <div className="text-right">
                      {r.salary > 0 ? (
                        <>
                          <p className="text-xs text-zinc-400 uppercase tracking-wide">Monthly Salary</p>
                          <p className={`text-xl font-bold ${RANK_COLORS[r.name] ?? "text-[#111827]"}`}>
                            {fmt(r.salary)}{r.salaryMax > r.salary ? ` – ${fmt(r.salaryMax)}` : ""}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-zinc-500">No salary</p>
                      )}
                    </div>
                  </div>

                  {/* Requirements */}
                  {r.requirements && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
                      {"directs" in r.requirements && (
                        <div className="bg-[#F8F9FA] rounded p-2">
                          <p className="text-zinc-400">Direct Referrals</p>
                          <p className="font-semibold text-[#111827]">{r.requirements.directs}</p>
                        </div>
                      )}
                      {"note" in r.requirements && (
                        <div className="bg-[#F8F9FA] rounded p-2 col-span-2">
                          <p className="text-zinc-400">Condition</p>
                          <p className="font-semibold text-[#111827]">{(r.requirements as { note: string }).note}</p>
                        </div>
                      )}
                      {"direct3X" in r.requirements && (
                        <div className="rounded border border-[#E8E8E8] bg-white p-2 col-span-2 sm:col-span-3">
                          <p className="text-sm font-semibold text-[#111827]">
                            {r.requirements.direct3X}× Direct 3X Achievers
                            <span className="ml-2 font-normal text-zinc-400">OR</span>
                            <span className="ml-2 font-semibold text-zinc-600">
                              {(r.requirements.orCondition as { direct3X: number; direct4X: number }).direct3X}×3X + {(r.requirements.orCondition as { direct3X: number; direct4X: number }).direct4X}×4X
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">Directs with earningsMultiplier ≥ 3 (3X) or ≥ 4 (4X)</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Achiever bonus */}
                  {r.achieverBonus && (
                    <div className="bg-[#F8F9FA] border border-[#E8E8E8] rounded p-2 text-xs space-y-1.5">
                      <p className="text-zinc-400 font-medium">Achiever Bonus — requalify every month</p>
                      {'isSpecial' in r.achieverBonus && r.achieverBonus.isSpecial ? (
                        <div className="text-[#111827] space-y-0.5">
                          <p>Qualify: <strong>{r.achieverBonus.base3X}×3X</strong> OR <strong>{r.achieverBonus.orConditionLabel}</strong></p>
                          <p className="text-zinc-500">+ Leadership Bonus Pool + Global Team Overrides (Performance Based)</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <p className="text-[#111827]">
                            Qualify: <strong>{r.achieverBonus.base3X}×3X Achievers</strong>
                            <span className="text-zinc-400"> OR </span>
                            <strong>{r.achieverBonus.orConditionLabel}</strong>
                          </p>
                          <div className="flex flex-wrap gap-3 text-[#111827] pt-0.5">
                            <span>Each extra 3X: <strong className="text-[#C41E3A]">+{fmt(r.achieverBonus.extra3X)}</strong></span>
                            <span>Each extra 4X: <strong className="text-[#C41E3A]">+{fmt(r.achieverBonus.extra4X)}</strong></span>
                            <span className="text-zinc-500">(Max cap applies)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Earnings Multiplier (3x / 4x) Rules ─── */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#C41E3A]" />Earnings Multiplier — Monthly Qualification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-zinc-400">
              Multiplier eligibility is rechecked <strong className="text-[#111827]">every month</strong> based on your last 30 days of team activity. You can gain or lose 3x/4x each cycle.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* 3x */}
              <div className="rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3 space-y-2">
                <p className="font-bold text-[#111827] text-base">3x Multiplier</p>
                <ul className="text-zinc-600 space-y-1 text-xs list-disc list-inside">
                  <li>Minimum <strong>3 active legs</strong></li>
                  <li>Each qualifying leg ≥ <strong>₹1.5L</strong> monthly business</li>
                  <li>Total team business ≥ <strong>₹5L</strong> (last 30 days)</li>
                </ul>
              </div>
              {/* 4x */}
              <div className="rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3 space-y-2">
                <p className="font-bold text-[#111827] text-base">4x Multiplier</p>
                <ul className="text-zinc-600 space-y-1 text-xs list-disc list-inside">
                  <li>Minimum <strong>4 active legs</strong></li>
                  <li>Each qualifying leg ≥ <strong>₹2L</strong> monthly business</li>
                  <li>Total team business ≥ <strong>₹10L</strong> (last 30 days)</li>
                  <li>Required for <strong>Elite Director</strong> and above</li>
                </ul>
              </div>
            </div>

            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Multiplier is recalculated at the start of every calendar month. If you no longer qualify, you drop back to 2.5x.
            </div>
          </CardContent>
        </Card>

        {/* ─── Grace Period & Salary Rules ─── */}
        <Card className="bg-white border-[#E8E8E8] mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-zinc-400" />Salary Grace Period Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3">
                <p className="font-semibold text-[#111827] mb-1">Met targets</p>
                <p className="text-zinc-600 text-xs">Receive 100% of your rank's monthly salary.</p>
              </div>
              <div className="rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3">
                <p className="font-semibold text-[#111827] mb-1">Missed 1 month</p>
                <p className="text-zinc-600 text-xs">Grace period — you receive 50% salary this month. Meet targets next month to return to full.</p>
              </div>
              <div className="rounded-lg border border-[#E8E8E8] bg-zinc-50 p-3">
                <p className="font-semibold text-[#111827] mb-1">Missed 2+ months</p>
                <p className="text-zinc-600 text-xs">Salary paused. Resume only after meeting performance targets again.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Salary is credited at the end of each calendar month after admin review. Actual amounts may vary within the published range.
            </p>
          </CardContent>
        </Card>

        {/* ─── Important Conditions ─── */}
        <Card className="bg-white border-[#E8E8E8] mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-zinc-400" />Important Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <ul className="space-y-2 text-zinc-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>Achievers must be <strong className="text-[#111827]">active</strong> (active package required)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span><strong className="text-[#111827]">Max 50% achievers from one leg</strong> — must come from multiple teams</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>Achiever bonus is recalculated <strong className="text-[#111827]">every month</strong> — you must requalify each cycle</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>4X Achievers (Advanced) count higher than 3X (Standard) and earn you more per achiever</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span className="text-zinc-400">Company's terms & conditions apply. Max cap on achiever bonuses applies at each rank.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default SalaryPage;
