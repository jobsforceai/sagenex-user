"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Alert from "../components/dashboard/Alert";
import { useAuth } from "@/app/context/AuthContext";
import {
  getDashboardData,
  autoSyncProfile,
  getReferralSummary,
  getRankProgress,
  getLeaderboard,
  getFinancialSummary,
  getTicketBalance,
} from "@/actions/user";
import {
  ArrowDownCircle,
  ArrowRight,
  BadgeDollarSign,
  Calendar,
  Copy,
  Crown,
  Gem,
  Gift,
  Sparkles,
  TrendingUp,
  Users,
  Wallet, Info} from "lucide-react";
import SetPasswordModal from "../components/dashboard/SetPasswordModal";
import MultiplierProgress from "../components/dashboard/MultiplierProgress";
import LegGauges from "../components/dashboard/LegGauges";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeletons";
import ScheduledCashBanner from "../components/wallet/ScheduledCashBanner";

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

const formatCurrencyCompact = (amount?: number) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const formatUsdCompact = (amount?: number) => {
  if (amount === undefined || amount === null) return "N/A";
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
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
      // Silent auto-sync (throttled 1/day server-side); re-fetch dashboard if corrections applied
      autoSyncProfile()
        .then((res: any) => {
          if (res?.synced && (res?.corrections ?? 0) > 0) {
            fetchInitialData();
          }
        })
        .catch(() => {});
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
    { label: "Invested Principal", value: financialSummary?.investedPrincipal, icon: Wallet, color: "#00b386" },
    { label: "Referral Earnings", value: financialSummary?.referralEarnings, icon: Users, color: "#C41E3A" },
    { label: "Salary Earned", value: financialSummary?.monthlyIncentive, icon: BadgeDollarSign, color: "#7C3AED" },
  ];

  const rankRequirements = rankProgress?.progress?.requirements;
  const usedWithdrawalLimit = Math.max(
    0,
    (wallet?.withdrawalCap ?? 0) - (wallet?.remainingWithdrawalLimit ?? 0),
  );
  const withdrawalUsedPct = wallet?.withdrawalCap
    ? Math.min(100, Math.round((usedWithdrawalLimit / wallet.withdrawalCap) * 100))
    : 0;

  const earningsUsedPct =
    wallet?.earningsCapTotal && wallet.earningsCapTotal > 0
      ? Math.min(100, Math.round(((wallet.earnedSinceBaseline ?? 0) / wallet.earningsCapTotal) * 100))
      : 0;

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
        <div className="min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
          <ScheduledCashBanner />
          <section className="relative overflow-hidden rounded-3xl bg-[#0F172A] text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
            <Image
              src="/dashboard/dashboard-hero-figurine.png"
              alt=""
              width={420}
              height={420}
              className="pointer-events-none absolute -right-12 bottom-0 hidden w-[360px] opacity-95 lg:block"
              priority
            />
            <Image
              src="/wallet/red_wave_no_background.png"
              alt=""
              width={760}
              height={360}
              className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto opacity-25"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(196,30,58,0.95)_0%,rgba(122,0,31,0.78)_42%,rgba(15,23,42,0.96)_100%)]" />
            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
              <div className="space-y-7">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white/80 backdrop-blur">
                    <Sparkles className="h-4 w-4 text-amber-200" />
                    Command center
                  </span>
                  <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                    {profile?.fullName || "Welcome back"}
                  </h1>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-bold text-white">
                      {currentRank?.name ?? "Member"}
                    </span>
                    {lifetimeRank?.name && lifetimeRank.name !== currentRank?.name && (
                      <span className="rounded-full bg-white/14 px-3 py-1 text-xs font-bold text-white/80">
                        Lifetime: {lifetimeRank.name}
                      </span>
                    )}
                    {earningsMultiplier && earningsMultiplier > 0 && (
                      <MultiplierProgress
                        earningsMultiplier={earningsMultiplier}
                        legDetails={(dashboardData as any)?.legDetails || []}
                        kycStatus={(dashboardData as any)?.kycStatus || (profile as any)?.kycStatus}
                        trigger={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/18 px-3 py-1 text-xs font-bold text-emerald-100 hover:bg-emerald-400/28"
                          >
                            {earningsMultiplier}x multiplier
                            <Info className="h-3 w-3" />
                          </button>
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Available Balance", value: formatCurrencyCompact(wallet?.availableBalance), icon: Wallet },
                    { label: "Rank Progress", value: `${Math.round(progressPercentage)}%`, icon: TrendingUp },
                    { label: "Tickets", value: ticketBalance?.totalTickets ?? 0, icon: Gift },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-2xl border border-white/12 bg-white/12 p-4 backdrop-blur">
                      <Icon className="h-5 w-5 text-amber-100" />
                      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.08em] text-white/58">{label}</p>
                      <p className="mt-1 truncate text-2xl font-black text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/14 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-white/60">Next rank</p>
                    <p className="mt-1 text-2xl font-black text-white">
                      {rankProgress?.progress?.nextRankName ?? "Max rank"}
                    </p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#C41E3A]">
                    <Crown className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold text-white/80">
                    <span>Completion</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/18">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-sm">
                  {rankRequirements?.directs && (
                    <div className="flex justify-between rounded-2xl bg-black/18 px-3 py-2">
                      <span className="text-white/65">Directs</span>
                      <span className="font-black text-white">
                        {rankRequirements.directs.current}/{rankRequirements.directs.required}
                      </span>
                    </div>
                  )}
                  {rankRequirements?.activeTeam && (
                    <div className="flex justify-between rounded-2xl bg-black/18 px-3 py-2">
                      <span className="text-white/65">Active team</span>
                      <span className="font-black text-white">
                        {rankRequirements.activeTeam.current}/{rankRequirements.activeTeam.required}
                      </span>
                    </div>
                  )}
                  {rankRequirements?.legRule && (
                    <div className="flex justify-between rounded-2xl bg-black/18 px-3 py-2">
                      <span className="text-white/65">Qualified legs</span>
                      <span className="font-black text-white">
                        {rankRequirements.legRule.current}/{rankRequirements.legRule.required}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <LegGauges
            earningsMultiplier={earningsMultiplier}
            legDetails={(dashboardData as any)?.legDetails || []}
            kycStatus={(dashboardData as any)?.kycStatus || (profile as any)?.kycStatus}
          />

          {consecutiveMonthsMissed === 1 && (
            <Alert
              type="warning"
              message="You have missed your performance target for 1 month. Your next salary will be reduced to 50%."
            />
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map(({ href, icon: Icon, title, subtitle, color }) => (
              <Link key={href} href={href} className="group">
                <div className="flex h-full items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)]">
                  <div className="min-w-0">
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: color + "18", color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-base font-black text-[#0F172A]">{title}</p>
                    <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#C41E3A]" />
                </div>
              </Link>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Money flow</p>
                    <h2 className="mt-1 text-2xl font-black text-[#0F172A]">Earnings Snapshot</h2>
                  </div>
                  <Link href="/wallet" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-[#0F172A] hover:bg-slate-50">
                    Open wallet <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {financialCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="relative overflow-hidden rounded-3xl border border-slate-100 bg-[#F8FAFC] p-5">
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10" style={{ background: color }} />
                      <Icon className="h-6 w-6" style={{ color }} />
                      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.1em] text-[#64748B]">{label}</p>
                      <p className="mt-2 truncate text-2xl font-black text-[#0F172A]">{formatCurrencyCompact(value)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Team engine</p>
                      <h2 className="mt-1 text-2xl font-black text-[#0F172A]">Referral Pulse</h2>
                    </div>
                    <Image src="/teams/icon-active-team-mint.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { label: "Direct referrals", value: referralSummary?.totalReferrals ?? 0 },
                      { label: "Invested", value: referralSummary?.investedCount ?? 0 },
                      { label: "Active agents", value: activeReferrals },
                      { label: "Downline volume", value: formatCurrencyCompact(referralSummary?.totalDownlineVolume) },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
                        <p className="mt-2 truncate text-xl font-black text-[#0F172A]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Rank path</p>
                      <h2 className="mt-1 text-2xl font-black text-[#0F172A]">What Matters Next</h2>
                    </div>
                    <Image src="/salary/rank-elite-director-crown.png" alt="" width={60} height={60} className="h-14 w-14 object-contain" />
                  </div>
                  <div className="mt-6 space-y-3">
                    {[
                      rankRequirements?.directs
                        ? { label: "Directs", current: rankRequirements.directs.current, required: rankRequirements.directs.required }
                        : null,
                      rankRequirements?.activeTeam
                        ? { label: "Active team", current: rankRequirements.activeTeam.current, required: rankRequirements.activeTeam.required }
                        : null,
                      rankRequirements?.legRule
                        ? { label: "Leg rule", current: rankRequirements.legRule.current, required: rankRequirements.legRule.required }
                        : null,
                    ].filter(Boolean).map((item) => {
                      const row = item as { label: string; current: number; required: number };
                      const pct = row.required > 0 ? Math.min(100, Math.round((row.current / row.required) * 100)) : 100;
                      return (
                        <div key={row.label}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-bold text-[#64748B]">{row.label}</span>
                            <span className="font-black text-[#0F172A]">{row.current}/{row.required}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#C41E3A]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {!rankRequirements && (
                      <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm font-semibold text-[#64748B]">
                        Rank requirements will appear when the next milestone is available.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {wallet?.bonuses && wallet.bonuses.length > 0 && (
                <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Level income</p>
                      <h2 className="mt-1 text-2xl font-black text-[#0F172A]">Unilevel Bonuses</h2>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-emerald-700">
                      L1 – L{wallet.bonuses.length}
                    </span>
                  </div>
                  <div className="grid divide-y divide-slate-100">
                    {wallet.bonuses.map((bonus) => (
                      <div key={bonus.level} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-6">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${bonus.isUnlocked ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                          L{bonus.level}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[#0F172A]">{bonus.name}</p>
                          <p className="text-xs font-semibold text-[#64748B]">
                            {bonus.isUnlocked ? "Unlocked · credited to wallet" : bonus.unlockRequirement}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${bonus.isUnlocked ? "text-emerald-600" : "text-amber-600"}`}>
                            {formatCurrencyCompact(bonus.lockedAmount)}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                            {bonus.isUnlocked ? "Earned" : "Locked"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Leaderboard</p>
                    <h2 className="mt-1 text-2xl font-black text-[#0F172A]">Top Performers</h2>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-amber-700">
                    This month
                  </span>
                </div>
                {leaderboardData ? (
                  <div className="grid divide-y divide-slate-100">
                    {leaderboardData.slice(0, 6).map((entry, index) => (
                      <div
                        key={`${entry.rank}-${entry.userId ?? entry.fullName}`}
                        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black ${
                            index === 0
                              ? "bg-amber-50 text-amber-600"
                              : index === 1
                                ? "bg-slate-100 text-slate-500"
                                : index === 2
                                  ? "bg-orange-50 text-orange-600"
                                  : "bg-[#FFF1F4] text-[#C41E3A]"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black"
                            style={avatarStyle(entry.fullName)}
                          >
                            {entry.fullName
                              .split(" ")
                              .map((namePart) => namePart[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#0F172A]">{entry.fullName}</p>
                            <p className="text-xs font-semibold text-[#64748B]">
                              {entry.packagesSold.toLocaleString("en-IN")} packages sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">
                            {formatCurrencyCompact(entry.earnings)}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                            Earnings
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 p-5 sm:p-6">
                    {[0, 1, 2, 3].map((item) => (
                      <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-5">
              <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="relative bg-[#FFF1F4] p-5">
                  <Image src="/dashboard/availbalance.png" alt="" fill className="object-cover opacity-50" sizes="360px" />
                  <div className="relative">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#C41E3A]">Wallet limits</p>
                    <p className="mt-2 text-3xl font-black text-[#C41E3A]">{formatCurrencyCompact(wallet?.remainingWithdrawalLimit)}</p>
                    <p className="mt-1 text-sm font-bold text-[#C41E3A]/70">available to withdraw</p>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  {[
                    { label: "Withdrawal cap", value: formatCurrencyCompact(wallet?.withdrawalCap), pct: withdrawalUsedPct },
                    { label: "Earnings cap used", value: `${earningsUsedPct}%`, pct: earningsUsedPct },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-bold text-[#64748B]">{item.label}</span>
                        <span className="font-black text-[#0F172A]">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">Withdrawn</p>
                      <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{formatCurrencyCompact(wallet?.totalLifetimeWithdrawals)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">Package</p>
                      <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{formatUsdCompact(dashboardData?.package?.packageUSD)}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Referral link</p>
                    <h2 className="mt-1 text-xl font-black text-[#0F172A]">Grow the network</h2>
                  </div>
                  <Users className="h-6 w-6 text-[#C41E3A]" />
                </div>
                <div className="mt-4 break-all rounded-2xl bg-slate-50 px-3 py-3 font-mono text-xs text-[#64748B]">
                  {referralLink || "—"}
                </div>
                <button
                  onClick={handleCopy}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C41E3A] py-3 text-sm font-black text-white transition hover:bg-[#ad1b34]"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </section>

              <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Rewards fuel</p>
                    <h2 className="mt-1 text-xl font-black text-[#0F172A]">Tickets</h2>
                  </div>
                  <Image src="/dashboard/dashboard-ticket-figurine.png" alt="" width={76} height={76} className="h-16 w-16 object-contain" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-violet-700">Available</p>
                    <p className="mt-1 text-2xl font-black text-violet-700">{ticketBalance?.totalTickets ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">Invested</p>
                    <p className="mt-1 truncate text-lg font-black text-[#0F172A]">{formatUsdCompact(ticketBalance?.totalInvestedUSD)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-[#64748B]">
                  Last calculated:{" "}
                  {ticketBalance?.lastCalculatedAt ? new Date(ticketBalance.lastCalculatedAt).toLocaleString() : "N/A"}
                </p>
              </section>

              {earningsMultiplierDeadline && (
                <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-amber-700">Multiplier window</p>
                      <p className="text-lg font-black text-[#0F172A]">{earningsMultiplier ?? 0}x active</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-amber-800">
                    Deadline: {new Date(earningsMultiplierDeadline).toLocaleString()}
                  </p>
                </section>
              )}
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
