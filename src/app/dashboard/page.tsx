"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
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

// --- INTERFACES ---
interface Profile {
  fullName: string;
  profilePicture: string;
  referralCode: string;
  joinDate: string;
  userId: string;
}

interface Wallet {
  lifetimeEarnings: number;
}

interface UserPackage {
  packageUSD: number;
}

interface DashboardData {
  profile: Profile;
  wallet: Wallet;
  package: UserPackage;
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
  currentRank: {
    name: string;
  };
  progress: {
    percentage: number;
    nextRankName: string | null;
    requirements: {
      directs: {
        current: number;
        required: number;
      };
      team: {
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

const ALL_RANKS = ["Member", "Starter", "Builder", "Director", "Executive"];

// --- COMPONENT ---
const DashboardPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const referralLink =
    dashboardData?.profile.referralCode
      ? `${window.location.origin}/login?ref=${dashboardData.profile.referralCode}`
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

    const fetchData = async () => {
      try {
        const [
          dashboardRes,
          summaryRes,
          treeRes,
          rankRes,
          leaderboardRes,
          financialRes,
        ] = await Promise.all([
          getDashboardData(),
          getReferralSummary(),
          getTeamTree(),
          getRankProgress(),
          getLeaderboard(),
          getFinancialSummary(),
        ]);

        if (dashboardRes.error) setError(dashboardRes.error);
        else setDashboardData(dashboardRes);

        if (summaryRes.error) console.error("Failed to fetch referral summary:", summaryRes.error);
        else setReferralSummary(summaryRes);

        if (treeRes.error) console.error("Failed to fetch team tree:", treeRes.error);
        else setTreeData(treeRes);

        if (rankRes.error) console.error("Failed to fetch rank progress:", rankRes.error);
        else setRankProgress(rankRes);

        if (leaderboardRes.error) console.error("Failed to fetch leaderboard:", leaderboardRes.error);
        else setLeaderboardData(leaderboardRes);

        if (financialRes.error) console.error("Failed to fetch financial summary:", financialRes.error);
        else setFinancialSummary(financialRes);

      } catch (err) {
        setError("An unexpected error occurred while fetching data.");
        console.error(err);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, isAuthenticated, loading, router]);

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
  if (rankProgress?.progress.requirements) {
    if (rankProgress.progress.requirements.directs.required > 0) {
      gamifiedRequirements.push({
        text: `Have ${rankProgress.progress.requirements.directs.required} direct referrals. (You have ${rankProgress.progress.requirements.directs.current})`,
        met:
          rankProgress.progress.requirements.directs.current >=
          rankProgress.progress.requirements.directs.required,
      });
    }
    if (rankProgress.progress.requirements.team.required > 0) {
      gamifiedRequirements.push({
        text: `Have ${rankProgress.progress.requirements.team.required} team members. (You have ${rankProgress.progress.requirements.team.current})`,
        met:
          rankProgress.progress.requirements.team.current >=
          rankProgress.progress.requirements.team.required,
      });
    }
  }

  const gamifiedData = rankProgress
    ? {
        progressPct: rankProgress.progress.percentage,
        subtitle: rankProgress.progress.nextRankName
          ? `Progress to ${rankProgress.progress.nextRankName}`
          : "You have reached the highest rank!",
        badges: ALL_RANKS.map((rank) => ({
          label: rank,
          earned:
            ALL_RANKS.indexOf(rank) <=
            ALL_RANKS.indexOf(rankProgress.currentRank.name),
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

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar userLevel={rankProgress?.currentRank.name} />
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
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold">
              {wallet.lifetimeEarnings.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Full-width Agent Overview */}
        <div className="mb-6">
          {dashboardData && rankProgress && (
            <AgentOverview
              name={dashboardData.profile.fullName}
              avatarUrl={dashboardData.profile.profilePicture}
              currentLevel={rankProgress.currentRank.name}
              nextLevelLabel={rankProgress.progress.nextRankName || ""}
              progressPct={rankProgress.progress.percentage}
              joinDate={dashboardData.profile.joinDate}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <EarningsSummary data={financialSummary} />
            {gamifiedData && (
              <GamifiedChallenges
                title="Rank & Progress"
                subtitle={gamifiedData.subtitle}
                progressPct={gamifiedData.progressPct}
                badges={gamifiedData.badges}
                requirements={gamifiedData.requirements}
              />
            )}
            {leaderboardData.length > 0 && (
              <Leaderboard
                leaderboardData={leaderboardData}
                currentUserId={profile.userId}
              />
            )}
            {referralSummary && (
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <SmartUpdates />
          </div>
        </div>

        {/* Full-width Binary Tree View */}
        <div className="mt-6">
          {formattedLegs && <SixLegTreeView legs={formattedLegs} />}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
