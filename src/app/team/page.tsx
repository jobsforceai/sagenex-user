"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import TreeClient from "./TreeClient";
import PlacementQueue from "@/app/components/dashboard/PlacementQueue";
import { Button } from "@/components/ui/button";
import { UserNode, ParentNode, QueuedUser } from "@/types";
import {
  getBonusRulesConfig,
  getTeamTree,
  getPlacementQueue,
  getDashboardData,
  getReferralSummary,
  getLeaderboard,
  getFinancialSummary,
} from "@/actions/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Loader2, RotateCw, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TreeApiResponse {
  tree: UserNode;
  parent: ParentNode | null;
}

type BonusRulesConfig = {
  rulesCutoff?: {
    iso?: string;
    timezone?: string;
    description?: string;
  };
  directBonus?: {
    firstDepositOnly?: boolean;
    percentageLabel?: string;
    recipient?: string;
    notes?: string;
  };
  unilevelBonus?: {
    appliesOn?: string;
    chainStart?: string;
    levels?: { level: number; percentageLabel?: string }[];
    notes?: string;
  };
  unilevelUnlockRules?: {
    level: number;
    description?: string;
    activeLegDepth?: number;
    activeLegsRequired?: number;
    activeTeamRequired?: number;
    requiresTest?: boolean;
  }[];
  reinvestmentBonus?: {
    appliesOn?: string;
    levels?: {
      cycle: string;
      depositNumber: number;
      totalPercentageLabel?: string;
      splits?: { level: number; percentageLabel?: string }[];
    }[];
    notes?: string;
  };
};

interface Referral {
  activityStatus?: string;
}

interface ReferralSummary {
  totalReferrals?: number;
  referrals?: Referral[];
  investedCount?: number;
  totalDownlineVolume?: number;
  // Full-downline counts (full team, not just direct referrals)
  totalDownlineCount?: number;
  activeDownlineCount?: number;
  inactiveDownlineCount?: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  fullName: string;
  profilePicture: string | null;
  packagesSold: number;
  earnings: number;
}

interface FinancialSummary {
  referralEarnings?: number;
  monthlyIncentive?: number;
}

// Frontend displays unilevel levels as +1 to match user-facing terminology.
// Backend rules start at level 1 (internal), but UI should start at level 2.
const DISPLAY_LEVEL_OFFSET = 1;

// UI-only baseline rule for "Level 1" in the frontend (not provided by backend).
const DEFAULT_LEVEL_ONE_RULE = {
  level: 1,
  description: "Have 1 active member at Level 1.",
  requiresTest: false,
  activeLegDepth: 1,
  activeLegsRequired: 1,
  activeTeamRequired: 0,
};

const teamAsset = {
  total: "/teams/icon-total-team-crimson.png",
  active: "/teams/icon-active-team-mint.png",
  left: "/teams/icon-left-team-purple.png",
  bonus: "/teams/icon-team-bonus-gold.png",
  rules: "/teams/icon-bonus-rules-document.png",
  info: "/teams/icon-info-crimson.png",
  medals: [
    "/teams/medal-gold-rank-1.png",
    "/teams/medal-silver-rank-2.png",
    "/teams/medal-bronze-rank-3.png",
  ],
} as const;

const formatCurrency = (amount?: number) =>
  (amount ?? 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const countMembers = (node?: UserNode | null): number => {
  if (!node) return 0;
  return (node.children || []).reduce((total, child) => total + 1 + countMembers(child), 0);
};

const countActiveMembers = (node?: UserNode | null): number => {
  if (!node) return 0;
  return (node.children || []).reduce(
    (total, child) =>
      total + (Number(child.packageUSD || 0) > 0 ? 1 : 0) + countActiveMembers(child),
    0,
  );
};

const maskName = (value: string) => {
  const clean = value.trim();
  if (clean.length <= 2) return clean;
  return `${clean.charAt(0)}${"*".repeat(Math.min(5, Math.max(2, clean.length - 2)))}${clean.charAt(clean.length - 1)}`;
};

const percent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

const TeamStatCard = ({
  label,
  shortLabel,
  value,
  subtitle,
  icon,
}: {
  label: string;
  shortLabel?: string;
  value: string | number;
  subtitle: string;
  icon: string;
}) => (
  <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-5 sm:shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <Image src={icon} alt="" width={54} height={54} className="h-8 w-8 object-contain sm:h-14 sm:w-14" />
    <p className="mt-2 truncate text-[9px] font-black uppercase tracking-[0.06em] text-[#64748B] sm:mt-5 sm:text-sm sm:font-medium sm:normal-case sm:tracking-normal">
      <span className="sm:hidden">{shortLabel || label}</span>
      <span className="hidden sm:inline">{label}</span>
    </p>
    <p className="mt-1 truncate text-base font-black leading-none text-[#0F172A] sm:mt-2 sm:text-3xl">{value}</p>
    <p className="mt-1 hidden text-sm text-[#64748B] sm:block">{subtitle}</p>
  </div>
);

const TeamPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [treeData, setTreeData] = useState<TreeApiResponse | null>(null);
  const [queue, setQueue] = useState<QueuedUser[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRulesConfig | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);

  const fetchTeamData = useCallback(async () => {
    setDataLoading(true);
    setTreeLoading(true);

    // Fire the heavy referral tree separately — it can take several seconds
    // for users with large downlines (200+ users). Don't block the rest of
    // the page on it.
    getTeamTree()
      .then((res) => {
        if (res?.error) console.error("Could not fetch team tree:", res.error);
        else setTreeData(res);
      })
      .catch((e) => console.error("Tree fetch failed:", e))
      .finally(() => setTreeLoading(false));

    // Light fetches: kick them in parallel and let the page render as the
    // critical ones (referral summary, dashboard) come back.
    try {
      const [
        queueResult,
        bonusRulesResult,
        dashboardResult,
        referralResult,
        leaderboardResult,
        financialResult,
      ] = await Promise.all([
        getPlacementQueue(),
        getBonusRulesConfig(),
        getDashboardData(),
        getReferralSummary(),
        getLeaderboard('team'),
        getFinancialSummary(),
      ]);

      if (queueResult?.error) console.error("Could not fetch placement queue:", queueResult.error);
      else setQueue(queueResult);

      if (bonusRulesResult?.error) console.error("Could not fetch bonus rules:", bonusRulesResult.error);
      else setBonusRules(bonusRulesResult);

      if (dashboardResult?.error) console.error("Could not fetch dashboard data:", dashboardResult.error);

      if (referralResult?.error) console.error("Could not fetch referral summary:", referralResult.error);
      else setReferralSummary(referralResult);

      if (leaderboardResult?.error) console.error("Could not fetch leaderboard:", leaderboardResult.error);
      else setLeaderboardData(Array.isArray(leaderboardResult) ? leaderboardResult : []);

      if (financialResult?.error) console.error("Could not fetch financial summary:", financialResult.error);
      else setFinancialSummary(financialResult);
    } catch {
      setError("An error occurred while fetching team data");
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchTeamData();
    }
  }, [isAuthenticated, authLoading, router, fetchTeamData]);

  if (authLoading || dataLoading) {
    return (
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          {/* Loading hero with explicit copy so users understand why they're waiting */}
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F4]">
                <Loader2 className="h-6 w-6 animate-spin text-[#C8103E]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">Loading your team</p>
                <p className="mt-1 text-base font-black text-[#0F172A] sm:text-lg">Building your referral tree and downline metrics…</p>
                <p className="mt-1 text-xs text-[#64748B]">For larger downlines (200+ members) this can take a few seconds. Hang tight.</p>
              </div>
            </div>
          </div>
          <div className="h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-3xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]" />
            ))}
          </div>
          <div className="h-[680px] animate-pulse rounded-3xl bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-lg font-black text-red-700">Unable to load team data</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button onClick={fetchTeamData} className="wallet-red-control mt-5 bg-[#C8103E] text-white hover:bg-[#A90D32]">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Full downline (entire tree under this user) — prefer backend's downline counts.
  const totalTeam = referralSummary?.totalDownlineCount ?? countMembers(treeData?.tree);
  // Active = isPackageActive && packageUSD > 0, computed across the full downline.
  const activeTeam = referralSummary?.activeDownlineCount ?? countActiveMembers(treeData?.tree);
  const inactiveTeam = referralSummary?.inactiveDownlineCount ?? Math.max(0, totalTeam - activeTeam);
  const leftTeam = 0;
  const teamBonus = financialSummary?.referralEarnings ?? financialSummary?.monthlyIncentive ?? 0;
  const topPerformers = leaderboardData.slice(0, 3);
  const activePct = percent(activeTeam, totalTeam);
  const inactivePct = percent(inactiveTeam, totalTeam);
  const leftPct = percent(leftTeam, totalTeam);

  return (
    <>
      <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">My Team</h1>
              <p className="mt-1 text-sm text-[#64748B] sm:text-base">
                View your team structure and bonus rules.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                className="h-12 rounded-xl border-slate-200 bg-white px-4 font-bold text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                onClick={() => setBonusModalOpen(true)}
              >
                <Image
                  src={teamAsset.rules}
                  alt=""
                  width={22}
                  height={22}
                  className="mr-2 h-5 w-5 object-contain"
                />
                Bonus Rules
              </Button>
            </div>
          </header>

          <section className="grid grid-cols-4 gap-2 sm:gap-4">
            <TeamStatCard
              label="Total Team"
              shortLabel="Total"
              value={totalTeam.toLocaleString("en-IN")}
              subtitle="Members"
              icon={teamAsset.total}
            />
            <TeamStatCard
              label="Active Team"
              shortLabel="Active"
              value={activeTeam.toLocaleString("en-IN")}
              subtitle="Active"
              icon={teamAsset.active}
            />
            <TeamStatCard
              label="Left Team"
              shortLabel="Inactive"
              value={inactiveTeam.toLocaleString("en-IN")}
              subtitle="Inactive"
              icon={teamAsset.left}
            />
            <TeamStatCard
              label="Team Bonus"
              shortLabel="Bonus"
              value={formatCurrency(teamBonus)}
              subtitle="This Cycle"
              icon={teamAsset.bonus}
            />
          </section>

          {queue.length > 0 && <PlacementQueue queue={queue} onUserPlaced={fetchTeamData} />}

          {treeLoading ? (
            <div className="relative rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F4]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#C8103E]" />
                </div>
                <div>
                  <p className="text-base font-black text-[#0F172A]">Loading your team tree</p>
                  <p className="text-sm text-[#64748B]">This can take a moment for larger downlines (200+ members).</p>
                </div>
              </div>
              <div className="relative mt-5 h-[640px] overflow-hidden rounded-3xl bg-slate-100">
                <div className="absolute inset-0 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[#C8103E]" />
                    <span className="text-sm font-bold text-[#0F172A]">Building tree…</span>
                  </div>
                </div>
              </div>
            </div>
          ) : treeData && treeData.tree ? (
            <TreeClient tree={treeData.tree} />
          ) : (
            <section className="rounded-3xl border border-slate-200/70 bg-white p-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <Image src={teamAsset.total} alt="" width={96} height={96} className="mx-auto h-24 w-24 object-contain opacity-80" />
              <p className="mt-4 text-lg font-black text-[#0F172A]">No team members yet</p>
              <p className="mt-1 text-sm text-[#64748B]">
                Start sharing your referral link to build your network.
              </p>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
              <h2 className="text-lg font-black text-[#0F172A]">Team Overview</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
                <div className="relative mx-auto h-44 w-44">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="42" fill="none" stroke="#F1F5F9" strokeWidth="16" />
                    <circle
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${activePct * 2.64} 264`}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${inactivePct * 2.64} 264`}
                      strokeDashoffset={`-${activePct * 2.64}`}
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="42"
                      fill="none"
                      stroke="#C8103E"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${leftPct * 2.64} 264`}
                      strokeDashoffset={`-${(activePct + inactivePct) * 2.64}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-[#0F172A]">{totalTeam.toLocaleString("en-IN")}</p>
                    <p className="text-sm text-[#64748B]">Total Team</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Active Members", count: activeTeam, pct: activePct, color: "bg-emerald-500" },
                    { label: "Inactive Members", count: inactiveTeam, pct: inactivePct, color: "bg-slate-300" },
                    { label: "Left Members", count: leftTeam, pct: leftPct, color: "bg-[#C8103E]" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0">
                      <span className="inline-flex items-center gap-3 text-sm text-[#64748B]">
                        <span className={`h-2 w-2 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="text-sm font-black text-[#0F172A]">
                        {item.count.toLocaleString("en-IN")} ({item.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-[#0F172A]">Top Performers</h2>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="How Top Performers is calculated"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-[#64748B] transition hover:bg-slate-50 hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="end"
                        className="max-w-[280px] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.12)]"
                      >
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">How it works</p>
                        <p className="mt-1.5 text-xs font-semibold text-[#0F172A]">
                          Ranks sponsors in your downline by team business this calendar month (IST).
                        </p>
                        <p className="mt-1.5 text-xs text-[#475569]">
                          Resets on the 1st of every month, so the list will look empty in the first day or two until fresh package activations come in.
                        </p>
                        <p className="mt-1.5 text-xs text-[#475569]">
                          Earnings = Direct + Unilevel + ROI Upline bonuses received this month.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0F172A] transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20"
                >
                  View all
                </button>
              </div>
              <div className="mt-5 space-y-4">
                {topPerformers.length > 0 ? (
                  topPerformers.map((performer, index) => (
                    <div key={`${performer.userId || performer.fullName}-${index}`} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Image
                          src={teamAsset.medals[index] || teamAsset.medals[2]}
                          alt={`Rank ${index + 1}`}
                          width={42}
                          height={42}
                          className="h-11 w-11 shrink-0 object-contain"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#0F172A]">{maskName(performer.fullName)}</p>
                          <p className="text-xs text-[#64748B]">Team: {performer.packagesSold.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-black text-emerald-600">
                        +{formatCurrency(performer.earnings)}
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
          </section>

          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-[#FFF1F4] px-5 py-4 text-sm font-medium text-[#C8103E]">
            <Image src={teamAsset.info} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            <p>Team data is updated in real-time. Build your team and earn more rewards!</p>
          </div>
        </div>

        {bonusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-4xl rounded-3xl border border-slate-200/70 bg-white p-6 text-[#0F172A] shadow-[0_25px_80px_rgba(15,23,42,0.18)] max-h-[85vh] overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">Bonus Rules</h2>
                <p className="text-xs text-[#64748B]">
                  {bonusRules?.rulesCutoff?.description || "Rules apply from the cutoff date below."}
                </p>
                {bonusRules?.rulesCutoff?.iso && (
                  <p className="mt-1 text-xs text-slate-400">
                    Cutoff: {new Date(bonusRules.rulesCutoff.iso).toLocaleString()}{" "}
                    {bonusRules?.rulesCutoff?.timezone ? `(${bonusRules.rulesCutoff.timezone})` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBonusModalOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 overflow-y-auto max-h-[70vh] pr-2">
              <Tabs defaultValue="first" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 border border-slate-200 rounded-2xl p-1">
                  <TabsTrigger value="first">First Investment</TabsTrigger>
                  <TabsTrigger value="reinvest">Reinvestments</TabsTrigger>
                </TabsList>

                <TabsContent value="first" className="mt-5">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-sm text-[#64748B]">Direct Bonus</p>
                      <p className="mt-2 text-2xl font-black text-[#0F172A]">
                        {bonusRules?.directBonus?.percentageLabel || "—"}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        Recipient: {bonusRules?.directBonus?.recipient || "—"}
                      </p>
                      {bonusRules?.directBonus?.notes && (
                        <p className="mt-2 text-xs text-[#64748B]">
                          {bonusRules.directBonus.notes}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                      <p className="text-sm text-[#64748B]">Unilevel Bonus</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {bonusRules?.unilevelBonus?.levels?.map((level) => (
                          <div
                            key={level.level}
                            className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2"
                          >
                            {/* Backend levels start at 1; UI shows levels starting at 2 */}
                            <span className="text-[#475569]">
                              Level {level.level + DISPLAY_LEVEL_OFFSET}
                            </span>
                            <span className="text-[#0F172A]">{level.percentageLabel || "—"}</span>
                          </div>
                        )) || (
                          <p className="text-xs text-slate-400">No unilevel levels configured.</p>
                        )}
                      </div>
                      {bonusRules?.unilevelBonus?.notes && (
                        <p className="mt-3 text-xs text-[#64748B]">
                          {bonusRules.unilevelBonus.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                    <p className="text-sm text-[#64748B]">Unilevel Unlock Rules</p>
                    <div className="mt-3 space-y-2 text-xs">
                      {/* UI adds Level 1 rule and shifts backend levels by +1 for clarity */}
                      {[DEFAULT_LEVEL_ONE_RULE, ...(bonusRules?.unilevelUnlockRules || [])].map(
                        (rule) => {
                          const displayLevel =
                            rule === DEFAULT_LEVEL_ONE_RULE
                              ? 1
                              : rule.level + DISPLAY_LEVEL_OFFSET;
                          const isDefaultLevelOne = rule === DEFAULT_LEVEL_ONE_RULE;
                          const activeLegsRequired = rule.activeLegsRequired ?? 0;
                          const activeLegDepth = rule.activeLegDepth ?? displayLevel;
                          const activeTeamRequired = rule.activeTeamRequired ?? 0;
                          const descriptionText = isDefaultLevelOne
                            ? "Have 1 active member at Level 1."
                            : activeTeamRequired > 0
                              ? `Have ${activeLegsRequired} active users at Level ${activeLegDepth} and ${activeTeamRequired} active team members.`
                              : `Have ${activeLegsRequired} active users at Level ${activeLegDepth}.`;
                          return (
                            <div
                              key={`rule-${displayLevel}`}
                              className={`flex flex-col gap-1 rounded-lg border px-3 py-2 ${
                                isDefaultLevelOne
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-slate-200/70 bg-slate-50"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={
                                    isDefaultLevelOne ? "text-emerald-700" : "text-[#0F172A]"
                                  }
                                >
                                  Level {displayLevel}
                                </span>
                                {isDefaultLevelOne && (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700">
                                    Unlocked
                                  </span>
                                )}
                              </div>
                              <p
                                className={
                                  isDefaultLevelOne ? "text-emerald-600" : "text-[#64748B]"
                                }
                              >
                                {descriptionText}
                              </p>
                            </div>
                          );
                        }
                      )}
                      {(!bonusRules?.unilevelUnlockRules ||
                        bonusRules.unilevelUnlockRules.length === 0) && (
                        <p className="text-xs text-slate-400">No unlock rules configured.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reinvest" className="mt-5">
                  <div className="space-y-3">
                    {bonusRules?.reinvestmentBonus?.levels?.map((cycle) => (
                      <div
                        key={cycle.cycle}
                        className="rounded-xl border border-slate-200/70 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-[#64748B]">
                              {cycle.cycle} · Deposit #{cycle.depositNumber}
                            </p>
                            <p className="text-lg font-black text-[#0F172A]">
                              Total: {cycle.totalPercentageLabel || "—"}
                            </p>
                          </div>
                        </div>
                        {cycle.splits && cycle.splits.length > 0 ? (
                          cycle.splits.length === 1 && cycle.splits[0].level === 1 ? null : (
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {cycle.splits.map((split) => (
                                <div
                                  key={split.level}
                                  className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2"
                                >
                                  <span className="text-[#475569]">Level {split.level}</span>
                                  <span className="text-[#0F172A]">
                                    {split.percentageLabel || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <p className="mt-3 text-xs text-slate-400">No splits configured.</p>
                        )}
                      </div>
                    )) || (
                      <p className="text-xs text-slate-400">No reinvestment rules configured.</p>
                    )}
                    {bonusRules?.reinvestmentBonus?.notes && (
                      <p className="text-xs text-[#64748B]">
                        {bonusRules.reinvestmentBonus.notes}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TeamPage;
