"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "../components/dashboard/Alert";
import { useAuth } from "@/app/context/AuthContext";
import {
  getDashboardData,
  getReferralSummary,
  getRankProgress,
  getLeaderboard,
  getFinancialSummary,
  getTicketBalance,
} from "@/actions/user";
import AppShell from "@/app/components/AppShell";
import {
  ArrowDownCircle,
  BadgeDollarSign,
  Copy,
  Gem,
  Gift,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SetPasswordModal from "../components/dashboard/SetPasswordModal";

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
  earningsCapTotal?: number;
  earnedSinceBaseline?: number;
  remainingEarningsCap?: number;
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
      monthlyBusiness: { current: number; required: number };
      legRule: { current: number; required: number; businessPerLeg: number };
    };
  };
  progress: {
    nextRankName: string | null;
    requirements: {
      directs: { current: number; required: number };
      activeTeam: { current: number; required: number };
      legRule?: { current: number; required: number; businessPerLeg: number };
      requires4x?: boolean;
    } | null;
  };
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

// --- COMPONENT ---
const DashboardPage = () => {
  const { token, isAuthenticated, loading, showSetPasswordModal, onPasswordSet } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[] | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [ticketBalance, setTicketBalance] = useState<{
    totalTickets: number;
    totalInvestedUSD: number;
    lastCalculatedAt: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    const code = dashboardData?.profile?.referralCode;
    if (!code) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/login?ref=${code}`;
  }, [dashboardData?.profile?.referralCode]);

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
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
      getRankProgress().then((res) => {
        if (res.error) console.error("Failed to fetch rank progress:", res.error);
        else setRankProgress(res);
      });
      getReferralSummary().then((res) => {
        if (res.error) console.error("Failed to fetch referral summary:", res.error);
        else setReferralSummary(res);
      });
      getLeaderboard().then((res) => {
        if (res.error) console.error("Failed to fetch leaderboard:", res.error);
        else setLeaderboardData(res);
      });
      getFinancialSummary().then((res) => {
        if (res.error) console.error("Failed to fetch financial summary:", res.error);
        else setFinancialSummary(res);
      });
      getTicketBalance().then((res) => {
        if (res.error) console.error("Failed to fetch ticket balance:", res.error);
        else setTicketBalance(res);
      });
    };

    fetchSecondaryData();
  }, [token]);

  const progressPercentage = rankProgress?.progress?.requirements
    ? (() => {
        const { directs, activeTeam, legRule, requires4x } =
          rankProgress.progress.requirements;
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

  const showLoading = loading || !dashboardData;
  const showError = !showLoading && Boolean(error);
  const profile = dashboardData?.profile;
  const wallet = dashboardData?.wallet;
  const lifetimeRank = dashboardData?.rank ?? rankProgress?.rank;
  const currentRank =
    rankProgress?.performanceRank ?? dashboardData?.performanceRank ?? lifetimeRank;
  const consecutiveMonthsMissed = lifetimeRank?.consecutiveMonthsMissed;
  const earningsMultiplierDeadline =
    profile?.earningsMultiplierDeadline ?? dashboardData?.earningsMultiplierDeadline ?? null;

  const quickActions = [
    {
      href: "/salary",
      icon: BadgeDollarSign,
      title: "Salary",
      subtitle: "Eligibility and monthly status",
    },
    {
      href: "/rewards",
      icon: Gift,
      title: "Rewards",
      subtitle: "Claim and manage benefits",
    },
    {
      href: "/payouts",
      icon: ArrowDownCircle,
      title: "Payouts",
      subtitle: "Withdrawals and history",
    },
    {
      href: "/sgnx-gold",
      icon: Gem,
      title: "SGNX Gold",
      subtitle: "Gold and cash plans",
    },
  ];

  const financialCards = [
    {
      label: "Invested Principal",
      value: financialSummary?.investedPrincipal,
      icon: Wallet,
    },
    {
      label: "Referral Earnings",
      value: financialSummary?.referralEarnings,
      icon: Users,
    },
    {
      label: "Promotion Bonus",
      value: financialSummary?.oneTimePromotionBonus,
      icon: Gift,
    },
    {
      label: "Monthly Incentive",
      value: financialSummary?.monthlyIncentive,
      icon: TrendingUp,
    },
  ];

  const activeReferrals = referralSummary?.referrals?.filter((r) => r.activityStatus === "Active").length ?? 0;

  return (
    <AppShell
      balance={wallet?.availableBalance}
      userName={profile?.fullName}
      userRank={currentRank?.name}
      avatarUrl={profile?.profilePicture}
    >
      {showSetPasswordModal && <SetPasswordModal onPasswordSet={onPasswordSet} />}

      {showLoading ? (
        <div className="p-6 space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : showError ? (
        <div className="flex items-center justify-center py-32 text-zinc-400">
          Error: {error}
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <section className="rounded-2xl border border-[#e8e8e8] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#0a0a0a]">
                  Welcome back, {profile?.fullName?.split(" ")[0]}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-xl border border-[#e8e8e8] bg-[#fafafa] px-4 py-3 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                  Available Balance
                </p>
                <p className="text-3xl font-black text-[#C41E3A]">
                  {wallet?.availableBalance?.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e8e8e8] bg-[#fcfcfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Current Rank</p>
                <p className="mt-1 text-xl font-bold text-[#0a0a0a]">{currentRank?.name ?? "Member"}</p>
              </div>
              <div className="rounded-xl border border-[#e8e8e8] bg-[#fcfcfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Rank Progress</p>
                <p className="mt-1 text-xl font-bold text-[#0a0a0a]">{Math.round(progressPercentage)}%</p>
              </div>
              <div className="rounded-xl border border-[#e8e8e8] bg-[#fcfcfc] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Package</p>
                <p className="mt-1 text-xl font-bold text-[#0a0a0a]">{formatCurrency(dashboardData?.package?.packageUSD)}</p>
              </div>
            </div>

            {rankProgress?.progress?.nextRankName && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-600">Progress to {rankProgress.progress.nextRankName}</span>
                  <span className="font-semibold text-[#C41E3A]">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-[#C41E3A] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                  />
                </div>
              </div>
            )}
          </section>

          {consecutiveMonthsMissed === 1 && (
            <Alert
              type="warning"
              message="You have missed your performance target for 1 month. Your next salary will be reduced to 50%."
            />
          )}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {quickActions.map(({ href, icon: Icon, title, subtitle }) => (
                <Link key={href} href={href} className="group">
                  <Card className="h-full rounded-xl border-[#e8e8e8] bg-white shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-[#C41E3A]/35 group-hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#C41E3A10]">
                        <Icon className="h-5 w-5 text-[#C41E3A]" />
                      </div>
                      <p className="text-sm font-bold text-[#0a0a0a]">{title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-[#0a0a0a]">Earnings Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {financialCards.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-xl border border-[#e8e8e8] bg-[#fcfcfc] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
                          <Icon className="h-4 w-4 text-zinc-400" />
                        </div>
                        <p className="text-lg font-bold text-[#0a0a0a]">{formatCurrency(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-[#0a0a0a]">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboardData ? (
                    <div className="space-y-2">
                      {leaderboardData.slice(0, 6).map((entry) => (
                        <div
                          key={`${entry.rank}-${entry.userId ?? entry.fullName}`}
                          className="flex items-center justify-between rounded-lg border border-[#ededed] bg-[#fcfcfc] px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C41E3A10] text-xs font-bold text-[#C41E3A]">
                              {entry.rank}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[#0a0a0a]">{entry.fullName}</p>
                              <p className="text-xs text-zinc-500">{entry.packagesSold} packages sold</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-[#00b386]">{formatCurrency(entry.earnings)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-[#0a0a0a]">Referral Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">Referral Link</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={referralLink}
                        className="w-full rounded-lg border border-[#e8e8e8] bg-[#fafafa] px-3 py-2 text-xs text-zinc-700"
                      />
                      <button
                        onClick={handleCopy}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e8e8e8] bg-white text-zinc-600 transition hover:border-[#C41E3A]/50 hover:text-[#C41E3A]"
                        aria-label="Copy referral link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    {copied && <p className="mt-1 text-xs font-medium text-[#00b386]">Copied</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[#e8e8e8] bg-[#fcfcfc] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Total Referrals</p>
                      <p className="mt-1 text-lg font-bold text-[#0a0a0a]">{referralSummary?.totalReferrals ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#e8e8e8] bg-[#fcfcfc] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Active Agents</p>
                      <p className="mt-1 text-lg font-bold text-[#0a0a0a]">{activeReferrals}</p>
                    </div>
                    <div className="rounded-lg border border-[#e8e8e8] bg-[#fcfcfc] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Invested</p>
                      <p className="mt-1 text-lg font-bold text-[#0a0a0a]">{referralSummary?.investedCount ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-[#e8e8e8] bg-[#fcfcfc] p-3">
                      <p className="text-[11px] uppercase tracking-wide text-zinc-500">Downline Volume</p>
                      <p className="mt-1 text-lg font-bold text-[#0a0a0a]">{formatCurrency(referralSummary?.totalDownlineVolume)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-[#0a0a0a]">Wallet Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Withdrawal cap</span>
                    <span className="font-semibold text-[#0a0a0a]">{formatCurrency(wallet?.withdrawalCap)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Withdrawn</span>
                    <span className="font-semibold text-[#0a0a0a]">{formatCurrency(wallet?.totalLifetimeWithdrawals)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-2">
                    <span className="text-zinc-500">Remaining limit</span>
                    <span className="font-semibold text-[#00b386]">{formatCurrency(wallet?.remainingWithdrawalLimit)}</span>
                  </div>
                  {wallet?.earningsCapTotal !== undefined && (
                    <>
                      <div className="mt-2 flex items-center justify-between border-t border-[#f0f0f0] pt-2">
                        <span className="text-zinc-500">Earnings cap</span>
                        <span className="font-semibold text-[#0a0a0a]">{formatCurrency(wallet?.earningsCapTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Earned so far</span>
                        <span className="font-semibold text-[#0a0a0a]">{formatCurrency(wallet?.earnedSinceBaseline)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Cap remaining</span>
                        <span className="font-semibold text-[#00b386]">{formatCurrency(wallet?.remainingEarningsCap)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-[#0a0a0a]">Ticket Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Total tickets</span>
                    <span className="font-semibold text-[#0a0a0a]">{ticketBalance?.totalTickets ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Total invested</span>
                    <span className="font-semibold text-[#0a0a0a]">{formatCurrency(ticketBalance?.totalInvestedUSD)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f0f0f0] pt-2 text-xs text-zinc-500">
                    <span>Last calculated</span>
                    <span>
                      {ticketBalance?.lastCalculatedAt
                        ? new Date(ticketBalance.lastCalculatedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {earningsMultiplierDeadline && (
                <Card className="rounded-2xl border-[#e8e8e8] bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold text-[#0a0a0a]">Multiplier Window</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-600">
                      Qualification deadline: {new Date(earningsMultiplierDeadline).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Current multiplier: <span className="font-semibold text-[#0a0a0a]">{dashboardData?.earningsMultiplier ?? 0}x</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};

export default DashboardPage;
