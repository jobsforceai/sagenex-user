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
import {
  ArrowDownCircle,
  BadgeDollarSign,
  Copy,
  Crown,
  Gem,
  Gift,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SetPasswordModal from "../components/dashboard/SetPasswordModal";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeletons";
import DashboardVisualSection from "../components/dashboard/DashboardVisualSection";

// ─── Interfaces ────────────────────────────────────────────────────

interface Profile {
  fullName: string;
  profilePicture: string;
  referralCode: string;
  joinDate: string;
  userId: string;
  earningsMultiplierDeadline?: string | null;
  earningsMultiplier?: number;
}

interface WalletData {
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
  wallet: WalletData;
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

// ─── Helpers ───────────────────────────────────────────────────────

const formatCurrency = (amount?: number) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrencyCompact = (amount?: number) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const avatarStyle = (name: string) => {
  const hue = (name.charCodeAt(0) * 37) % 360;
  return {
    background: `hsl(${hue}, 60%, 92%)`,
    color: `hsl(${hue}, 55%, 38%)`,
  };
};

// ─── KPI Card ──────────────────────────────────────────────────────

const KPICard = ({
  label,
  value,
  sub,
  icon,
  accentColor = "#C41E3A",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accentColor?: string;
}) => (
  <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-400">
          {label}
        </p>
        <p className="truncate text-[26px] font-extrabold leading-none tracking-tight text-[#111827]">
          {value}
        </p>
        {sub && <p className="mt-1.5 text-[13px] text-zinc-500">{sub}</p>}
      </div>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accentColor + "18", color: accentColor }}
      >
        {icon}
      </div>
    </div>
  </div>
);

// ─── Page Component ────────────────────────────────────────────────

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
  const earningsMultiplier =
    dashboardData?.earningsMultiplier ?? profile?.earningsMultiplier;

  const activeReferrals =
    referralSummary?.referrals?.filter((r) => r.activityStatus === "Active").length ?? 0;

  const quickActions = [
    {
      href: "/salary",
      icon: BadgeDollarSign,
      title: "Salary",
      subtitle: "Eligibility and monthly status",
      color: "#C41E3A",
    },
    {
      href: "/rewards",
      icon: Gift,
      title: "Rewards",
      subtitle: "Claim and manage benefits",
      color: "#7C3AED",
    },
    {
      href: "/payouts",
      icon: ArrowDownCircle,
      title: "Payouts",
      subtitle: "Withdrawals and history",
      color: "#00b386",
    },
    {
      href: "/sgnx-gold",
      icon: Gem,
      title: "SGNX Gold",
      subtitle: "Gold and cash plans",
      color: "#D4A017",
    },
  ];

  const financialCards = [
    { label: "Invested Principal", value: financialSummary?.investedPrincipal, icon: Wallet },
    { label: "Referral Earnings", value: financialSummary?.referralEarnings, icon: Users },
    { label: "Promotion Bonus", value: financialSummary?.oneTimePromotionBonus, icon: Gift },
    { label: "Monthly Incentive", value: financialSummary?.monthlyIncentive, icon: TrendingUp },
  ];

  return (
    <>
      {showSetPasswordModal && <SetPasswordModal onPasswordSet={onPasswordSet} />}

      {showLoading ? (
        <DashboardSkeleton />
      ) : showError ? (
        <div className="flex items-center justify-center py-32 text-zinc-400">
          Error: {error}
        </div>
      ) : (
        <div className="p-6 space-y-5">

          {/* ── Hero Banner ─────────────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-[20px] p-7 text-white"
            style={{ background: "linear-gradient(135deg, #C41E3A 0%, #A0152B 100%)" }}
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <div
              className="pointer-events-none absolute right-14 -bottom-14 h-40 w-40 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-[13px] font-medium opacity-75">Welcome back 👋</p>
                <h1 className="mb-1.5 text-[28px] font-extrabold leading-tight tracking-tight">
                  {profile?.fullName}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {currentRank?.name && (
                    <span
                      className="rounded-full px-3 py-0.5 text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {currentRank.name}
                    </span>
                  )}
                  {earningsMultiplier && earningsMultiplier > 0 && (
                    <span
                      className="rounded-full px-3 py-0.5 text-xs font-bold"
                      style={{ background: "rgba(0,179,134,0.35)", color: "#adfce8" }}
                    >
                      ×{earningsMultiplier} Multiplier
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="mb-1 text-xs font-medium opacity-70">Available Balance</p>
                <p className="text-[32px] font-black leading-none tracking-tighter">
                  {formatCurrencyCompact(wallet?.availableBalance)}
                </p>
                {wallet?.withdrawalCap !== undefined && (
                  <p className="mt-0.5 text-xs opacity-65">
                    Cap: {formatCurrencyCompact(wallet.withdrawalCap)}
                  </p>
                )}
              </div>
            </div>
            {rankProgress?.progress?.nextRankName && (
              <div className="relative z-10 mt-5 border-t border-white/20 pt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs" style={{ opacity: 0.85 }}>
                  <span className="font-medium">
                    Progress to {rankProgress.progress.nextRankName}
                  </span>
                  <span className="font-bold">{Math.round(progressPercentage)}%</span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                      background: "rgba(255,255,255,0.85)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── KPI Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard
              label="Current Rank"
              value={currentRank?.name ?? "Member"}
              sub={
                lifetimeRank?.name && lifetimeRank.name !== currentRank?.name
                  ? `Lifetime: ${lifetimeRank.name}`
                  : undefined
              }
              icon={<Crown className="h-5 w-5" />}
              accentColor="#C41E3A"
            />
            <KPICard
              label="Rank Progress"
              value={`${Math.round(progressPercentage)}%`}
              sub={
                rankProgress?.progress?.nextRankName
                  ? `To ${rankProgress.progress.nextRankName}`
                  : "Max rank reached"
              }
              icon={<TrendingUp className="h-5 w-5" />}
              accentColor="#C41E3A"
            />
            <KPICard
              label="Package Value"
              value={formatCurrencyCompact(dashboardData?.package?.packageUSD)}
              icon={<Wallet className="h-5 w-5" />}
              accentColor="#00b386"
            />
            <KPICard
              label="Tickets"
              value={ticketBalance?.totalTickets ?? 0}
              sub="Available"
              icon={<Gift className="h-5 w-5" />}
              accentColor="#7C3AED"
            />
          </div>

          {/* ── Salary Alert ─────────────────────────────────────── */}
          {consecutiveMonthsMissed === 1 && (
            <Alert
              type="warning"
              message="You have missed your performance target for 1 month. Your next salary will be reduced to 50%."
            />
          )}

          {/* ── Quick Actions ────────────────────────────────────── */}
          <section>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-400">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {quickActions.map(({ href, icon: Icon, title, subtitle, color }) => (
                <Link key={href} href={href} className="group">
                  <div className="h-full rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <div
                      className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: color + "18", color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-[#111827]">{title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Visual Hub ─────────────────────────────────────── */}
          <DashboardVisualSection />

          {/* ── Main Grid ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

            {/* Left column (2/3) */}
            <div className="space-y-5 xl:col-span-2">

              {/* Earnings Snapshot */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-[18px] font-bold tracking-tight text-[#111827]">
                  Earnings Snapshot
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {financialCards.map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-zinc-400">
                          {label}
                        </p>
                        <Icon className="h-4 w-4 text-zinc-300" />
                      </div>
                      <p className="text-lg font-extrabold text-[#111827]">
                        {formatCurrency(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performers */}
              <div className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
                <div className="border-b border-[#E8E8E8] px-5 py-4">
                  <h2 className="text-[18px] font-bold tracking-tight text-[#111827]">
                    Top Performers
                  </h2>
                  <p className="mt-0.5 text-[13px] text-zinc-500">This month&apos;s leaderboard</p>
                </div>
                {leaderboardData ? (
                  <div>
                    {leaderboardData.slice(0, 6).map((entry, i) => (
                      <div
                        key={`${entry.rank}-${entry.userId ?? entry.fullName}`}
                        className="flex items-center gap-3 border-b border-[#E8E8E8] px-5 py-3.5 last:border-0"
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                            i === 0 ? "bg-amber-50 text-amber-500" : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
                          style={avatarStyle(entry.fullName)}
                        >
                          {entry.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-[#111827]">
                            {entry.fullName}
                          </p>
                          <p className="text-xs text-zinc-500">{entry.packagesSold} packages sold</p>
                        </div>
                        <p className="shrink-0 text-[14px] font-bold text-[#111827]">
                          {formatCurrency(entry.earnings)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-px p-5">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
              </div>
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-5">

              {/* Referral Link */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">
                  Referral Link
                </h2>
                <div className="mb-3 break-all rounded-xl bg-[#F8F9FA] px-3 py-2.5 font-mono text-[12px] text-zinc-500">
                  {referralLink || "—"}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
                  style={{ background: copied ? "#00b386" : "#C41E3A" }}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* Referral Stats */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">
                  Referral Stats
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Total Referrals", value: referralSummary?.totalReferrals ?? 0 },
                    { label: "Active Agents", value: activeReferrals },
                    { label: "Invested", value: referralSummary?.investedCount ?? 0 },
                    {
                      label: "Downline Vol.",
                      value: formatCurrency(referralSummary?.totalDownlineVolume),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-[#F8F9FA] p-3">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.05em] text-zinc-400">
                        {label}
                      </p>
                      <p className="text-[18px] font-extrabold text-[#111827]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallet Summary */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">
                  Wallet Summary
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Withdrawal cap</span>
                    <span className="font-semibold text-[#111827]">
                      {formatCurrency(wallet?.withdrawalCap)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Withdrawn</span>
                    <span className="font-semibold text-[#111827]">
                      {formatCurrency(wallet?.totalLifetimeWithdrawals)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-2.5">
                    <span className="text-zinc-500">Remaining limit</span>
                    <span className="font-semibold text-[#00b386]">
                      {formatCurrency(wallet?.remainingWithdrawalLimit)}
                    </span>
                  </div>
                  {wallet?.earningsCapTotal !== undefined && (
                    <>
                      <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-2.5">
                        <span className="text-zinc-500">Earnings cap</span>
                        <span className="font-semibold text-[#111827]">
                          {formatCurrency(wallet?.earningsCapTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Earned so far</span>
                        <span className="font-semibold text-[#111827]">
                          {formatCurrency(wallet?.earnedSinceBaseline)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Cap remaining</span>
                        <span className="font-semibold text-[#00b386]">
                          {formatCurrency(wallet?.remainingEarningsCap)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ticket Balance */}
              <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">
                  Ticket Balance
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Total tickets</span>
                    <span className="font-semibold text-[#111827]">
                      {ticketBalance?.totalTickets ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Total invested</span>
                    <span className="font-semibold text-[#111827]">
                      {formatCurrency(ticketBalance?.totalInvestedUSD)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-2.5 text-xs text-zinc-400">
                    <span>Last calculated</span>
                    <span>
                      {ticketBalance?.lastCalculatedAt
                        ? new Date(ticketBalance.lastCalculatedAt).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Multiplier Window (conditional) */}
              {earningsMultiplierDeadline && (
                <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-[16px] font-bold tracking-tight text-[#111827]">
                    Multiplier Window
                  </h2>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Current multiplier</span>
                      <span className="font-bold text-[#111827]">{earningsMultiplier ?? 0}×</span>
                    </div>
                    <div className="border-t border-[#F0F0F0] pt-2.5">
                      <p className="text-xs text-zinc-400">Qualification deadline</p>
                      <p className="mt-0.5 font-semibold text-[#111827]">
                        {new Date(earningsMultiplierDeadline).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
