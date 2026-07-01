"use client";

"use client";

import AppLoadingScreen from "@/app/components/auth/AppLoadingScreen";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import { CompoundingProjectionModal } from "@/app/components/wallet/CompoundingProjectionModal";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
import ScheduledCashBanner from "@/app/components/wallet/ScheduledCashBanner";
import { OverviewTab } from "@/app/components/wallet/tabs/OverviewTab";
import { TransferTab } from "@/app/components/wallet/tabs/TransferTab";
import { RewardsTab } from "@/app/components/wallet/tabs/RewardsTab";
import { HistoryTab } from "@/app/components/wallet/tabs/HistoryTab";
import { LiquidityProviderTab } from "@/app/components/wallet/tabs/LiquidityProviderTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getWalletData,
  getDashboardData,
  autoSyncProfile,
  getKycStatus,
  getWalletCurrentCycleHistory,
} from "@/actions/user";
import { KycStatus } from "@/types";
import {
  AlertCircle,
  ArrowUp,
  Eye,
  LockKeyhole,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";

interface WalletTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  description?: string;
  referenceId?: string;
  sourceType?: string;
  sourceId?: string;
  fromUserId?: string;
  toUserId?: string;
  method?: string;
  currency?: string;
  meta: {
    unlockedLevel?: number;
    rule?: string;
    progressAtUnlock?:
      | number
      | {
          team?: number;
          directs?: number;
          activeLegs?: number;
          activeTeam?: number;
          testQualified?: number;
        };
    senderId?: string;
    senderName?: string;
    recipientId?: string;
    recipientName?: string;
    transactionId?: string;
    transferType?: string;
    bonusType?: string;
    depositId?: string;
    sgchainTransferId?: string;
    reference?: string;
    currencyCode?: string;
    amountLocal?: number;
    [key: string]: unknown;
  };
}

interface LockedBonus {
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
}

interface WalletSummary {
  availableBalance: number;
  sgchainStakingBalance?: number;
  capLockedBalance?: number;
  bonuses: LockedBonus[];
  withdrawalCap?: number;
  totalLifetimeWithdrawals?: number;
  remainingWithdrawalLimit?: number;
  earningsCapTotal?: number;
  earnedSinceBaseline?: number;
  remainingEarningsCap?: number;
  // Daily (rolling 24h) withdrawal limit — surfaced by the backend
  // so the withdrawal form's MAX button can cap correctly instead of
  // letting the user submit an amount the backend will reject with
  // "daily limit exceeded". Backend rule: limit = packageUSD.
  dailyWithdrawalLimit?: number;
  withdrawnInLast24h?: number;
  dailyWithdrawalRemaining?: number;
}

interface WalletLedgerResponse {
  summary?: WalletSummary;
  ledger?: WalletTransaction[];
}

interface CurrentCycleSummary {
  currentCycleEarnings: number;
  ledgerTotal: number;
  delta: number;
  cycleStart?: string | null;
  cycleEnd?: string | null;
  cycleId?: string | null;
}

interface CurrentCycleLedgerEntry {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

interface CycleSnapshot {
  id: string;
  startedAt?: string | null;
  endedAt?: string | null;
  earnedInCycle?: number;
  capTotal?: number;
  packageUSD?: number;
  multiplier?: number;
  totalLifetimeEarningsAtEnd?: number;
  withdrawalsAtEnd?: number;
  withdrawalCarryoverAtEnd?: number;
  reason?: string;
}

interface CurrentCycleHistory {
  summary: CurrentCycleSummary;
  ledger: CurrentCycleLedgerEntry[];
  cycles?: CycleSnapshot[];
}

interface AutoSyncResponse {
  synced?: boolean;
  corrections?: number;
  error?: string;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

const formatCompactCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const walletAsset = {
  heroWave: "/wallet/red_wave_no_background.png",
  goldCard: "/wallet/gold-card.png",
  moneyBag: "/wallet/money-bag-rupee.png",
} as const;

const WalletPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [cycleHistory, setCycleHistory] = useState<CurrentCycleHistory | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("current");
  const [cycleOpen, setCycleOpen] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(true);

  const [withdrawDrawerOpen, setWithdrawDrawerOpen] = useState(false);
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [compoundingModalOpen, setCompoundingModalOpen] = useState(false);
  const [compoundingEnabled, setCompoundingEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    import("@/actions/user").then(({ getCompoundingStatus }) => {
      getCompoundingStatus().then((res) => {
        if (!res?.error) setCompoundingEnabled(Boolean(res.compoundingEnabled));
      });
    });
  }, []);

  const fetchData = useCallback(async () => {
    setWalletLoading(true);
    setDashboardLoading(true);
    setCycleLoading(true);
    setWalletError(null);
    setDashboardError(null);
    setCycleError(null);

    try {
      let resolvedSummary: WalletSummary | null = null;
      const [walletResult, dashboardResult, kycResult, cycleResult] =
        await Promise.allSettled([
          getWalletData(),
          getDashboardData(),
          getKycStatus(),
          getWalletCurrentCycleHistory({ includeCycles: true, cyclesLimit: 5 }),
        ]);

      if (walletResult.status === "fulfilled") {
        const walletRes = walletResult.value;
        if (walletRes?.error) {
          setWalletError(walletRes.error);
          setTransactions([]);
        } else {
          const walletPayload = walletRes as WalletLedgerResponse | WalletTransaction[];
          if (Array.isArray(walletPayload)) {
            setTransactions(walletPayload);
          } else {
            setTransactions(walletPayload.ledger || []);
          }

          if (!Array.isArray(walletPayload)) {
            const raw = walletPayload as Record<string, unknown>;
            const summaryFromPayload =
              walletPayload.summary ??
              ((walletPayload as WalletSummary).availableBalance !== undefined
                ? (walletPayload as WalletSummary)
                : null);

            if (summaryFromPayload) {
              const summaryAny = summaryFromPayload as unknown as Record<string, unknown>;
              const stakingBalance =
                summaryAny.sgchainStakingBalance ??
                raw.sgchainStakingBalance ??
                (raw.data as Record<string, unknown> | undefined)?.sgchainStakingBalance ??
                0;
              const mergedSummary = {
                ...summaryFromPayload,
                sgchainStakingBalance: Number(stakingBalance) || 0,
              };
              resolvedSummary = mergedSummary;
              setWalletSummary(mergedSummary);
            }
          }
        }
      } else {
        setWalletError("Unable to load wallet history.");
      }
      setWalletLoading(false);

      if (dashboardResult.status === "fulfilled") {
        const dashboardRes = dashboardResult.value;
        if (dashboardRes?.error) {
          setDashboardError(dashboardRes.error);
        } else {
          const dashWallet = dashboardRes.wallet || null;
          if (dashWallet) {
            const dashboardSummary: WalletSummary = {
              ...dashWallet,
              sgchainStakingBalance:
                dashWallet.sgchainStakingBalance ?? dashboardRes.sgchainStakingBalance ?? 0,
            };
            resolvedSummary = resolvedSummary
              ? {
                  ...resolvedSummary,
                  ...dashboardSummary,
                  bonuses: resolvedSummary.bonuses ?? dashboardSummary.bonuses,
                  sgchainStakingBalance:
                    resolvedSummary.sgchainStakingBalance ?? dashboardSummary.sgchainStakingBalance ?? 0,
                }
              : dashboardSummary;
          }
          setWalletSummary(resolvedSummary);
        }
      } else {
        setDashboardError("Unable to load dashboard summary.");
      }
      setDashboardLoading(false);

      if (kycResult.status === "fulfilled") {
        const kycData = kycResult.value;
        if (!kycData?.error) {
          setKycStatus(kycData);
        }
      }

      if (cycleResult.status === "fulfilled") {
        const cycleRes = cycleResult.value;
        if (cycleRes?.error) {
          setCycleError(cycleRes.error);
          setCycleHistory(null);
        } else {
          setCycleHistory(cycleRes?.summary ? cycleRes : null);
        }
      } else {
        setCycleError("Unable to load cycle earnings.");
      }
      setCycleLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setWalletError(message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    autoSyncProfile()
      .then((res: AutoSyncResponse) => {
        if (res?.synced && (res?.corrections ?? 0) > 0) {
          fetchData();
        }
      })
      .catch(() => {});
  }, [fetchData]);

  if (walletLoading && dashboardLoading) {
    return <AppLoadingScreen message="Loading wallet…" fullScreen={false} />;
  }

  const remainingWithdrawalLimit = Math.max(0, walletSummary?.remainingWithdrawalLimit ?? 0);
  const summaryLoading = walletLoading && dashboardLoading;
  const usedWithdrawal = Math.max(
    0,
    (walletSummary?.withdrawalCap ?? 0) - (walletSummary?.remainingWithdrawalLimit ?? 0),
  );
  const capUsedPct = walletSummary?.withdrawalCap
    ? Math.min(100, Math.round((usedWithdrawal / walletSummary.withdrawalCap) * 100))
    : 0;
  const earnedSinceBaseline = Math.max(0, walletSummary?.earnedSinceBaseline ?? 0);
  const earningsCapTotal = Math.max(0, walletSummary?.earningsCapTotal ?? 0);
  const remainingEarningsCap = Math.max(0, walletSummary?.remainingEarningsCap ?? 0);
  const earningsUsedPct = earningsCapTotal
    ? Math.min(100, Math.round((earnedSinceBaseline / earningsCapTotal) * 100))
    : 0;

  return (
    <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-3 py-4 pb-24 sm:px-6 sm:py-5 lg:px-8 lg:pb-5">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Wallet</h1>
          <p className="mt-1 hidden text-sm text-[#64748B] sm:block sm:text-base">
            Manage your balance, transfers and history
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
          {kycStatus && (
            <button
              type="button"
              onClick={() => router.push("/kyc")}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.06em] shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30 sm:h-11 sm:px-4 sm:text-xs sm:tracking-[0.08em] ${
                kycStatus.status === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  kycStatus.status === "VERIFIED" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {kycStatus.status === "VERIFIED" ? "KYC VERIFIED" : "KYC PENDING"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCompoundingModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:h-11 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Compounding</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${compoundingEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {compoundingEnabled === null ? '...' : compoundingEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </header>

      <div className="hidden sm:block">
        <ScheduledCashBanner />
      </div>

      <section className="wallet-red-surface relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_55%,#430010_100%)] p-3.5 text-white shadow-[0_22px_55px_rgba(122,0,31,0.25)] sm:p-4 md:rounded-3xl md:p-7 lg:p-8">
        <Image
          src={walletAsset.heroWave}
          alt=""
          width={760}
          height={520}
          className="pointer-events-none absolute -bottom-20 right-0 h-[72%] w-auto max-w-none opacity-40 md:-bottom-28 md:h-[80%] md:opacity-45"
          priority
        />
        <div className="absolute right-4 top-4 h-28 w-28 rounded-full bg-[#F59E0B]/20 blur-3xl md:right-8 md:top-8 md:h-48 md:w-48 md:bg-[#F59E0B]/25" />
        <div className="relative grid gap-2 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="space-y-2 md:space-y-7">
            <div>
              <div className="wallet-red-muted flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.12em] !text-white/70 md:gap-2 md:text-[11px] md:tracking-[0.18em]">
                Available Balance
                <Eye className="h-3 w-3 !text-white/60 md:h-4 md:w-4" aria-hidden="true" />
              </div>
              <div className="mt-1.5 truncate text-[2rem] font-black leading-none tracking-tight text-white sm:text-4xl md:mt-3 md:text-5xl lg:text-6xl">
                {summaryLoading ? "—" : formatCurrency(walletSummary?.availableBalance ?? 0)}
              </div>
              <div className="wallet-red-soft mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/15 bg-emerald-400/15 px-2 py-0.5 text-[8px] font-bold text-emerald-100 md:mt-4 md:gap-2 md:px-3 md:py-1.5 md:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {capUsedPct}% cap used
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 md:gap-3">
              {[
                { label: "Locked", shortLabel: "Locked", value: walletSummary?.capLockedBalance ?? 0, icon: LockKeyhole },
                { label: "Can Withdraw", shortLabel: "Can", value: remainingWithdrawalLimit, icon: WalletIcon },
                { label: "Earn Limit", shortLabel: "Limit", value: remainingEarningsCap, icon: TrendingUp },
                { label: "Withdrawn", shortLabel: "Out", value: walletSummary?.totalLifetimeWithdrawals ?? 0, icon: ArrowUp },
              ].map(({ label, shortLabel, value, icon: Icon }) => (
                <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur md:rounded-2xl md:p-3">
                  <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/15 md:mb-2 md:h-8 md:w-8">
                    <Icon className="h-3.5 w-3.5 !text-white md:h-4 md:w-4" />
                  </div>
                  <p className="wallet-red-muted truncate text-[7px] font-bold uppercase tracking-[0.06em] !text-white/60 md:text-[11px] md:tracking-[0.08em]">
                    <span className="md:hidden">{shortLabel}</span>
                    <span className="hidden md:inline">{label}</span>
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-black !text-white sm:text-xs md:mt-1 md:text-sm">
                    {summaryLoading ? "—" : formatCompactCurrency(Number(value))}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute right-2 top-3 h-20 w-28 opacity-35 sm:opacity-55 md:relative md:right-auto md:top-auto md:min-h-48 md:w-auto md:opacity-100 lg:min-h-64">
            <Image
              src={walletAsset.goldCard}
              alt="SAGENEX gold wallet card"
              width={480}
              height={330}
              className="absolute right-0 top-1/2 w-28 -translate-y-1/2 rotate-[-5deg] drop-shadow-2xl sm:w-44 md:w-64 lg:w-[360px]"
              priority
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 md:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-[#64748B] sm:text-[11px] sm:tracking-[0.12em]">Withdrawal Cap</p>
              <p className="mt-1 truncate text-base font-black tracking-tight text-[#0F172A] sm:mt-2 sm:text-3xl">
                {summaryLoading ? "—" : formatCompactCurrency(walletSummary?.withdrawalCap ?? 0)}
              </p>
              <p className="mt-0.5 hidden text-sm text-[#64748B] sm:block">Total limit</p>
            </div>
            <Image src={walletAsset.moneyBag} alt="" width={58} height={58} className="h-8 w-8 object-contain sm:h-14 sm:w-14" />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-5 sm:h-2">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${capUsedPct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-[#64748B] sm:text-[11px] sm:tracking-[0.12em]">Withdraw Limit</p>
              <p className="mt-1 truncate text-base font-black tracking-tight text-[#0F172A] sm:mt-2 sm:text-3xl">
                {summaryLoading ? "—" : formatCompactCurrency(remainingWithdrawalLimit)}
              </p>
              <p className="mt-0.5 hidden text-sm text-[#64748B] sm:block">{formatCompactCurrency(walletSummary?.totalLifetimeWithdrawals ?? 0)} withdrawn</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 sm:h-14 sm:w-14 sm:rounded-2xl">
              <ArrowUp className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
          <div className="absolute -bottom-8 right-0 h-24 w-40 rounded-full bg-violet-100 blur-2xl" />
          <div className="relative flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-[#64748B] sm:text-[11px] sm:tracking-[0.12em]">Earnings Cap</p>
              <p className="mt-1 truncate text-base font-black tracking-tight text-[#0F172A] sm:mt-2 sm:text-3xl">
                {summaryLoading ? "—" : formatCompactCurrency(earningsCapTotal)}
              </p>
              <p className="mt-0.5 hidden text-sm text-[#64748B] sm:block">{earningsUsedPct}% used</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:h-14 sm:w-14 sm:rounded-2xl">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-5 sm:h-2">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${earningsUsedPct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-[#64748B] sm:text-[11px] sm:tracking-[0.12em]">Earnings Limit</p>
              <p className="mt-1 truncate text-base font-black tracking-tight text-[#0F172A] sm:mt-2 sm:text-3xl">
                {summaryLoading ? "—" : formatCompactCurrency(remainingEarningsCap)}
              </p>
              <p className="mt-0.5 hidden text-sm text-[#64748B] sm:block">{formatCompactCurrency(earnedSinceBaseline)} earned this cycle</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:h-14 sm:w-14 sm:rounded-2xl">
              <WalletIcon className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-2">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1.5 rounded-none bg-transparent p-0 sm:gap-2">
            <TabsTrigger
              value="overview"
              className="wallet-red-tab rounded-full px-3 py-2 text-xs font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="wallet-red-tab rounded-full px-3 py-2 text-xs font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              SGChain
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="wallet-red-tab rounded-full px-3 py-2 text-xs font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Rewards
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="wallet-red-tab rounded-full px-3 py-2 text-xs font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="lp"
              className="wallet-red-tab rounded-full px-3 py-2 text-xs font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none sm:px-5 sm:py-2.5 sm:text-sm"
            >
              LP Pool
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            walletSummary={walletSummary}
            transactions={transactions}
            cycleHistory={cycleHistory}
            selectedCycleId={selectedCycleId}
            setSelectedCycleId={setSelectedCycleId}
            cycleOpen={cycleOpen}
            setCycleOpen={setCycleOpen}
            walletError={walletError}
            dashboardError={dashboardError}
            cycleError={cycleError}
            summaryLoading={summaryLoading}
            walletLoading={walletLoading}
            cycleLoading={cycleLoading}
            setCycleLoading={setCycleLoading}
            setCycleError={setCycleError}
            setCycleHistory={setCycleHistory}
            remainingWithdrawalLimit={remainingWithdrawalLimit}
            onWithdrawClick={() => setWithdrawDrawerOpen(true)}
            onTransferClick={() => setTransferDrawerOpen(true)}
            onViewAllTransactions={() => setActiveTab("history")}
          />
        </TabsContent>

        <TabsContent value="transfer" className="mt-4">
          <TransferTab currentBalance={walletSummary?.availableBalance ?? 0} onSuccess={fetchData} />
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <RewardsTab bonuses={walletSummary?.bonuses} loading={summaryLoading} userId={user?.userId} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <HistoryTab transactions={transactions} loading={walletLoading} error={walletError} />
        </TabsContent>

        <TabsContent value="lp" className="mt-4">
          <LiquidityProviderTab availableBalance={walletSummary?.availableBalance ?? 0} onSuccess={fetchData} />
        </TabsContent>
      </Tabs>

      <Drawer open={withdrawDrawerOpen} onOpenChange={setWithdrawDrawerOpen}>
        <DrawerContent className="border-[#E8E8E8] bg-white">
          <DrawerHeader>
            <DrawerTitle className="text-[#111827]">Withdraw Funds</DrawerTitle>
            <DrawerDescription>Request a withdrawal from your available balance</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
            {kycStatus?.status !== "VERIFIED" && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-700">KYC Verification Required</p>
                  <p className="mt-1 text-xs text-amber-700/90">
                    You must complete KYC verification before withdrawing funds.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 border-amber-400/50 text-amber-700 hover:bg-amber-50"
                    onClick={() => router.push("/kyc")}
                  >
                    Complete KYC
                  </Button>
                </div>
              </div>
            )}
            <WithdrawalRequest
              currentBalance={walletSummary?.availableBalance ?? 0}
              kycStatus={kycStatus?.status}
              remainingWithdrawalLimit={remainingWithdrawalLimit}
              dailyWithdrawalLimit={walletSummary?.dailyWithdrawalLimit}
              dailyWithdrawalRemaining={walletSummary?.dailyWithdrawalRemaining}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={transferDrawerOpen} onOpenChange={setTransferDrawerOpen}>
        <DrawerContent className="border-[#E8E8E8] bg-white">
          <DrawerHeader>
            <DrawerTitle className="text-[#111827]">Transfer Funds</DrawerTitle>
            <DrawerDescription>Send funds to another user in your network</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
            <p className="mb-4 text-xs text-zinc-500">
              Available Balance: {formatCurrency(walletSummary?.availableBalance ?? 0)}
            </p>
            <FundTransfer currentBalance={walletSummary?.availableBalance ?? 0} />
          </div>
        </DrawerContent>
      </Drawer>

      <CompoundingProjectionModal
        manualOpen={compoundingModalOpen}
        onManualClose={() => setCompoundingModalOpen(false)}
        onCompoundingChange={(enabled) => setCompoundingEnabled(enabled)}
      />
      </div>
    </div>
  );
};

export default WalletPage;
