"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "../components/dashboard/Alert";
import { useAuth } from "@/app/context/AuthContext";
import {
  getDashboardData,
  getReferralSummary,
  getTeamTree,
  getRankProgress,
  getLeaderboard,
  getFinancialSummary,
} from "@/actions/user";
import Navbar from "@/app/components/Navbar";
import { ArrowDownCircle, BadgeDollarSign, CalendarCheck, Crown, Gift, Ticket } from "lucide-react";
import AgentOverview from "../components/dashboard/AgentOverview";
import EarningsSummary from "../components/dashboard/EarningsSummary";
import GamifiedChallenges from "../components/dashboard/GamifiedChallenges";
import Leaderboard from "../components/dashboard/Leaderboard";
import ReferralGrowthTools from "../components/dashboard/ReferralAndGrowth";
import SixLegTreeView from "../components/dashboard/BinaryTreeView";
import SmartUpdates from "../components/dashboard/SmartUpdates";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- INTERFACES ---
interface Profile {
  fullName: string;
  profilePicture: string;
  referralCode: string;
  joinDate: string;
  userId: string;
  earningsMultiplierDeadline?: string | null;
  earningsMultiplier?: number;
}

interface Wallet {
  availableBalance: number;
  withdrawalCap: number;
  totalLifetimeWithdrawals: number;
  remainingWithdrawalLimit: number;
  bonuses: {
    level: number;
    name: string;
    lockedAmount: number;
    isUnlocked: boolean;
    unlockRequirement: string;
    progress: {
        activeLegs?: { current: number; required: number; depth?: number };
        activeTeam?: { current: number; required: number };
        testQualified?: { current: number; required: number };
    };
  }[];
}

interface UserPackage {
  packageUSD: number;
}

interface RankSnapshot {
  name: string;
  badge?: string;
  salary?: number;
  achievedAt?: string | null;
  consecutiveMonthsMissed?: number;
}

interface DashboardData {
  profile: Profile;
  wallet: Wallet;
  package: UserPackage;
  earningsMultiplier?: number;
  earningsMultiplierDeadline?: string | null;
  rank?: RankSnapshot;
  performanceRank?: RankSnapshot;
}

interface Referral {
  activityStatus: string;
}

interface ReferralSummary {
  totalReferrals: number;
  referrals: Referral[];
  investedCount: number;
  totalDownlineVolume: number;
}

interface TreeLeg {
  userId: string;
  fullName: string;
  packageUSD: number;
  activityStatus: string;
  children?: TreeLeg[];
}

interface TreeData {
  tree: {
    children: TreeLeg[];
  };
}

interface RankProgress {
  rank: {
    name: string;
    badge?: string;
    salary?: number;
    achievedAt?: string | null;
    consecutiveMonthsMissed?: number;
  };
  performanceRank: {
    name: string;
    badge?: string;
    salary?: number;
  };
  salaryEligibility: {
    isEligible: boolean;
    requirements: {
      monthlyBusiness: {
        current: number;
        required: number;
      };
      legRule: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
    };
  };
  progress: {
    nextRankName: string | null;
    requirements: {
      directs: {
        current: number;
        required: number;
      };
      activeTeam: {
        current: number;
        required: number;
      };
      legRule?: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
      requires4x?: boolean;
    } | null;
  };
}

interface FinancialSummary {
  investedPrincipal: number;
  referralEarnings: number;
  oneTimePromotionBonus: number;
  monthlyIncentive: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  fullName: string;
  profilePicture: string | null;
  packagesSold: number;
  earnings: number;
}

const ALL_RANKS = ["Member", "Starter", "Builder","Leader","Manager", "Director", "Crown"];

import LockedBonusesCard from "../components/dashboard/LockedBonusesCard";
import SetPasswordModal from "../components/dashboard/SetPasswordModal";
import WithdrawalLimit from "../components/dashboard/WithdrawalLimit";

// --- COMPONENT ---
const DashboardPage = () => {
  const { token, isAuthenticated, loading, showSetPasswordModal, onPasswordSet } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const referralLink =
    dashboardData?.profile.referralCode
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login?ref=${dashboardData.profile.referralCode}`
      : "";

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      alert("Referral link copied to clipboard!");
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const dashboardRes = await getDashboardData();
        if (dashboardRes.error) {
          setError(dashboardRes.error);
        } else {
          setDashboardData(dashboardRes);
        }
        console.log("Dashboard data fetched:", dashboardRes);
      } catch (err) {
        setError("An unexpected error occurred while fetching core data.");
        console.error(err);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, isAuthenticated, loading, router]);

  useEffect(() => {
    if (!token) return;

    const fetchSecondaryData = async () => {
        getRankProgress().then(res => {
            if (res.error) console.error("Failed to fetch rank progress:", res.error);
            else setRankProgress(res);
        });
      getReferralSummary().then(res => {
        if (res.error) console.error("Failed to fetch referral summary:", res.error);
        else setReferralSummary(res);
      });
      getTeamTree().then(res => {
        if (res.error) console.error("Failed to fetch team tree:", res.error);
        else setTreeData(res);
      });
      getLeaderboard().then(res => {
        if (res.error) console.error("Failed to fetch leaderboard:", res.error);
        else setLeaderboardData(res);
      });
      getFinancialSummary().then(res => {
        if (res.error) console.error("Failed to fetch financial summary:", res.error);
        else setFinancialSummary(res);
      });
    };

    fetchSecondaryData();
  }, [token]);

  const formattedLegs = treeData?.tree?.children.map((leg, index) => ({
    id: `Leg ${index + 1}`,
    head: {
      id: leg.userId,
      name: leg.fullName,
      volumeLabel: `${(leg.packageUSD / 1000).toFixed(1)}K`,
      active: leg.activityStatus === "Active",
    },
    children: leg.children?.map((child) => ({
      id: child.userId,
      name: child.fullName,
      volumeLabel: `${(child.packageUSD / 1000).toFixed(1)}K`,
      active: child.activityStatus === "Active",
    })),
  }));

  const progressPercentage = rankProgress?.progress?.requirements
    ? (() => {
        const { directs, activeTeam, legRule, requires4x } = rankProgress.progress.requirements;
        const reqs: Array<{ current: number; required: number }> = [];

        if (directs) reqs.push({ current: directs.current, required: directs.required });
        if (activeTeam) reqs.push({ current: activeTeam.current, required: activeTeam.required });
        if (legRule) reqs.push({ current: legRule.current, required: legRule.required });

        const percentages = reqs
          .filter((r) => r.required > 0)
          .map((r) => Math.min(100, (r.current / r.required) * 100));

        if (requires4x) {
          const multiplier =
            dashboardData?.earningsMultiplier ??
            dashboardData?.profile?.earningsMultiplier ??
            0;
          percentages.push(multiplier >= 4 ? 100 : 0);
        }

        if (percentages.length === 0) return 100;

        return percentages.reduce((acc, p) => acc + p, 0) / percentages.length;
      })()
    : 0;

  if (loading || !dashboardData) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Error: {error}
      </div>
    );
  }

  const { profile, wallet, rank: dashboardRank, performanceRank } = dashboardData;
  const lifetimeRank = dashboardRank ?? rankProgress?.rank;
  const currentRank = rankProgress?.performanceRank ?? performanceRank ?? lifetimeRank;
  const consecutiveMonthsMissed = lifetimeRank?.consecutiveMonthsMissed;
  const earningsMultiplierDeadline =
    profile?.earningsMultiplierDeadline ?? dashboardData.earningsMultiplierDeadline ?? null;
  return (
    <div className="bg-black text-white min-h-screen">
      {showSetPasswordModal && <SetPasswordModal onPasswordSet={onPasswordSet} />}
      <Navbar userLevel={currentRank?.name} />
      <main className="container mx-auto p-4 pt-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Crown className="mr-2 text-yellow-400" />
              Sagenex Hub
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile.fullName}!
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">
              {wallet.availableBalance.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Salary Alerts */}
        {consecutiveMonthsMissed === 1 && (
          <Alert
            type="warning"
            message="You have missed your performance target for 1 month. Your next salary will be reduced to 50%."
          />
        )}
        {/* {consecutiveMonthsMissed && consecutiveMonthsMissed >= 2 && (
          <Alert
            type="danger"
            message="Your salary is currently paused because you have missed your performance targets for 2 or more consecutive months."
          />
        )} */}

        {/* Full-width Agent Overview */}
        <div className="mb-6">
          <AgentOverview
            name={dashboardData.profile.fullName}
            avatarUrl={dashboardData.profile.profilePicture}
            currentLevel={currentRank?.name}
            nextLevelLabel={rankProgress?.progress?.nextRankName ?? undefined}
            progressPct={progressPercentage}
            packageUSD={dashboardData.package?.packageUSD}
            earningsMultiplier={dashboardData.earningsMultiplier}
            earningsMultiplierDeadline={earningsMultiplierDeadline}
            />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/salary" className="group">
              <Card className="relative overflow-hidden bg-linear-to-br from-emerald-500/10 via-black/20 to-black border border-emerald-500/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-emerald-400/50 group-hover:shadow-[0_18px_40px_rgba(16,185,129,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-300 via-emerald-500 to-emerald-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-emerald-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-200 flex items-center justify-center ring-1 ring-emerald-400/30">
                    <BadgeDollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Salary</CardTitle>
                    <p className="text-sm text-gray-400">Eligibility and monthly status</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/rewards" className="group">
              <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-black/20 to-black border border-amber-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-amber-300/50 group-hover:shadow-[0_18px_40px_rgba(251,191,36,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-amber-300 via-amber-500 to-amber-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-200 flex items-center justify-center ring-1 ring-amber-400/30">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Rewards</CardTitle>
                    <p className="text-sm text-gray-400">Claim and manage rewards</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/payouts" className="group">
              <Card className="relative overflow-hidden bg-gradient-to-br from-sky-500/10 via-black/20 to-black border border-sky-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-sky-300/50 group-hover:shadow-[0_18px_40px_rgba(56,189,248,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-sky-300 via-sky-500 to-sky-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-500/20 text-sky-200 flex items-center justify-center ring-1 ring-sky-400/30">
                    <ArrowDownCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Payouts</CardTitle>
                    <p className="text-sm text-gray-400">Withdrawals and history</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/tests/book" className="group">
              <Card className="relative overflow-hidden bg-linear-to-br from-rose-500/10 via-black/20 to-black border border-rose-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-rose-300/50 group-hover:shadow-[0_18px_40px_rgba(244,63,94,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-rose-300 via-rose-500 to-rose-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-rose-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rose-500/20 text-rose-200 flex items-center justify-center ring-1 ring-rose-400/30">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Schedule Test</CardTitle>
                    <p className="text-sm text-gray-400">Book your next exam slot</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/lottery" className="group">
              <Card className="relative overflow-hidden bg-linear-to-br from-cyan-500/10 via-black/20 to-black border border-cyan-400/20 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all group-hover:-translate-y-0.5 group-hover:border-cyan-300/50 group-hover:shadow-[0_18px_40px_rgba(34,211,238,0.18)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-br from-cyan-300 via-cyan-500 to-cyan-300" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 text-cyan-200 flex items-center justify-center ring-1 ring-cyan-400/30">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Lottery</CardTitle>
                    <p className="text-sm text-gray-400">Join active prize pools</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {financialSummary ? (
              <EarningsSummary data={financialSummary} />
            ) : (
              <Card>
                <CardHeader><CardTitle>Earnings Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            )}
            


            {leaderboardData ? (
              <Leaderboard
                leaderboardData={leaderboardData}
                currentUserId={profile.userId}
              />
            ) : (
              <Card>
                <CardHeader><CardTitle>Leaderboard</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            )}

            {referralSummary ? (
              <ReferralGrowthTools
                referralLink={referralLink}
                onCopy={handleCopy}
                totalReferrals={referralSummary.totalReferrals}
                activeAgents={
                  referralSummary.referrals.filter(
                    (r) => r.activityStatus === "Active"
                  ).length
                }
                investedAgents={referralSummary.investedCount}
                downlineVolumeLabel={`${(
                  referralSummary.totalDownlineVolume / 1000
                ).toFixed(1)}K`}
              />
            ) : (
              <Card>
                <CardHeader><CardTitle>Referral & Growth Tools</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <>
          {console.log("Dashboard Data Wallet:", dashboardData.wallet)}
          </>
          {/* Sidebar */}
          <div className="space-y-6">
            <SmartUpdates />
            {dashboardData.wallet.withdrawalCap && (
                <WithdrawalLimit
                    withdrawalCap={dashboardData.wallet.withdrawalCap}
                    totalLifetimeWithdrawals={dashboardData.wallet.totalLifetimeWithdrawals}
                    remainingWithdrawalLimit={dashboardData.wallet.remainingWithdrawalLimit}
                />
            )}
            {dashboardData.wallet.bonuses ? (
              <LockedBonusesCard bonuses={dashboardData.wallet.bonuses} />
            ) : (
              <Card>
                <CardHeader><CardTitle>Locked Bonuses</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Full-width Binary Tree View */}
        <div className="mt-6">
          {formattedLegs ? (
            <SixLegTreeView legs={formattedLegs} />
          ) : (
            <Card>
              <CardHeader><CardTitle>Team Structure</CardTitle></CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
