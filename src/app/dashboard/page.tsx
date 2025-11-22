"use client";

import { useEffect, useState } from "react";
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
import { Crown } from "lucide-react";
import AgentOverview from "../components/dashboard/AgentOverview";
import EarningsSummary from "../components/dashboard/EarningsSummary";
import GamifiedChallenges from "../components/dashboard/GamifiedChallenges";
import Leaderboard from "../components/dashboard/Leaderboard";
import ReferralGrowthTools from "../components/dashboard/ReferralAndGrowth";
import SixLegTreeView from "../components/dashboard/BinaryTreeView";
import SmartUpdates from "../components/dashboard/SmartUpdates";
import LockedBonuses from "../components/dashboard/LockedBonuses";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --- INTERFACES ---
interface Profile {
  fullName: string;
  profilePicture: string;
  referralCode: string;
  joinDate: string;
  userId: string;
}

interface Wallet {
  availableBalance: number;
  bonuses: {
    level: number;
    name: string;
    lockedAmount: number;
    isUnlocked: boolean;
    unlockRequirement: string;
    progress: {
      current: number;
      required: number;
    };
  }[];
}

interface UserPackage {
  packageUSD: number;
}

interface DashboardData {
  profile: Profile;
  wallet: Wallet;
  package: UserPackage;
  earningsMultiplier?: number;
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
  currentRankInDb: {
    name: string;
    badge: string;
    salary: number;
    achievedAt: string | null;
    consecutiveMonthsMissed: number;
  };
  calculatedRank: {
    name: string;
    badge: string;
    salary: number;
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

// --- COMPONENT ---
const DashboardPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
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
      getReferralSummary().then(res => {
        if (res.error) console.error("Failed to fetch referral summary:", res.error);
        else setReferralSummary(res);
      });
      getTeamTree().then(res => {
        if (res.error) console.error("Failed to fetch team tree:", res.error);
        else setTreeData(res);
      });
      getRankProgress().then(res => {
        if (res.error) console.error("Failed to fetch rank progress:", res.error);
        else setRankProgress(res);
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

  const gamifiedRequirements = [];
  if (rankProgress?.progress?.requirements) {
    const { directs, activeTeam } = rankProgress.progress.requirements;

    if (directs.required > 0) {
      gamifiedRequirements.push({
        text: `Have ${directs.required} direct referrals. (You have ${directs.current})`,
        met: directs.current >= directs.required,
      });
    }
    if (activeTeam?.required > 0) {
      gamifiedRequirements.push({
        text: `Have ${activeTeam.required} active team members. (You have ${activeTeam.current})`,
        met: activeTeam.current >= activeTeam.required,
      });
    }
  }

  const progressPercentage = rankProgress?.progress?.requirements
    ? (() => {
        const { directs, activeTeam } = rankProgress.progress.requirements;
        const reqs = [
          { current: directs.current, required: directs.required },
          { current: activeTeam?.current, required: activeTeam?.required },
        ];
        
        const percentages = reqs
          .filter(r => r.required > 0)
          .map(r => Math.min(100, (r.current / r.required) * 100));

        if (percentages.length === 0) return 100; // All requirements are 0, so they are met.

        return percentages.reduce((acc, p) => acc + p, 0) / percentages.length;
      })()
    : 0;



  const gamifiedData = rankProgress
    ? {
        subtitle: rankProgress.progress?.nextRankName
          ? `Progress to ${rankProgress.progress?.nextRankName}`
          : "You have reached the highest rank!",
        badges: ALL_RANKS.map((rank) => ({
          label: rank,
          earned:
            ALL_RANKS.indexOf(rank) <=
            ALL_RANKS.indexOf(rankProgress.currentRankInDb?.name),
        })),
        requirements: gamifiedRequirements,
      }
    : null;

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

  const { profile, wallet } = dashboardData;
  const allRequirementsMet =
    !!rankProgress &&
    rankProgress.currentRankInDb?.name !== rankProgress.calculatedRank?.name;
  
  const consecutiveMonthsMissed = rankProgress?.currentRankInDb?.consecutiveMonthsMissed;

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar userLevel={rankProgress?.currentRankInDb?.name} />
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
        {consecutiveMonthsMissed && consecutiveMonthsMissed >= 2 && (
          <Alert
            type="danger"
            message="Your salary is currently paused because you have missed your performance targets for 2 or more consecutive months."
          />
        )}

        {/* Full-width Agent Overview */}
        <div className="mb-6">
                    <AgentOverview
                      name={dashboardData.profile.fullName}
                      avatarUrl={dashboardData.profile.profilePicture}
                      currentLevel={rankProgress?.currentRankInDb?.name}
                      nextLevelLabel={rankProgress?.progress?.nextRankName || ""}
                      progressPct={progressPercentage}
                      packageUSD={dashboardData.package?.packageUSD}
                      earningsMultiplier={dashboardData.earningsMultiplier}
                    />
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
            
            {gamifiedData ? (
              <GamifiedChallenges
                title="Rank & Progress"
                subtitle={gamifiedData.subtitle}
                badges={gamifiedData.badges}
                requirements={gamifiedData.requirements}
                allRequirementsMet={allRequirementsMet}
                nextRankName={rankProgress?.progress?.nextRankName}
              />
            ) : (
              <Card>
                <CardHeader><CardTitle>Rank & Progress</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
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

          {/* Sidebar */}
          <div className="space-y-6">
            <SmartUpdates />
            {dashboardData.wallet.bonuses ? (
              <LockedBonuses bonuses={dashboardData.wallet.bonuses} />
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
