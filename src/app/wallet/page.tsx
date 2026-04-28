"use client";

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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
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
        } else if (!resolvedSummary) {
          const dashWallet = dashboardRes.wallet || null;
          if (dashWallet) {
            resolvedSummary = {
              ...dashWallet,
              sgchainStakingBalance:
                dashWallet.sgchainStakingBalance ?? dashboardRes.sgchainStakingBalance ?? 0,
            };
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
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router, fetchData]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] text-[#0a0a0a]">
        Loading...
      </div>
    );
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

  return (
    <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Wallet</h1>
          <p className="mt-1 text-sm text-[#64748B] sm:text-base">
            Manage your balance, transfers and history
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {kycStatus && (
            <button
              type="button"
              onClick={() => router.push("/kyc")}
              className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-[0.08em] shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30 ${
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
          <Button
            onClick={() => setWithdrawDrawerOpen(true)}
            className="wallet-red-control h-11 rounded-xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] px-5 font-bold text-white shadow-[0_14px_30px_rgba(200,16,62,0.24)] hover:from-[#C8103E] hover:to-[#68001A] focus:ring-2 focus:ring-[#C8103E]/30"
            disabled={!walletSummary}
          >
            <ArrowUp className="mr-1.5 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </header>

      <ScheduledCashBanner />

      <section className="wallet-red-surface relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_55%,#430010_100%)] p-5 text-white shadow-[0_22px_55px_rgba(122,0,31,0.25)] sm:p-7 lg:p-8">
        <Image
          src={walletAsset.heroWave}
          alt=""
          width={760}
          height={520}
          className="pointer-events-none absolute -bottom-28 right-0 h-[80%] w-auto max-w-none opacity-45"
          priority
        />
        <div className="absolute right-8 top-8 h-48 w-48 rounded-full bg-[#F59E0B]/25 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="space-y-7">
            <div>
              <div className="wallet-red-muted flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
                Available Balance
                <Eye className="h-4 w-4 text-white/60" aria-hidden="true" />
              </div>
              <div className="mt-3 text-4xl font-black leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
                {summaryLoading ? "—" : formatCurrency(walletSummary?.availableBalance ?? 0)}
              </div>
              <div className="wallet-red-soft mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {capUsedPct}% cap used
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Locked", value: walletSummary?.capLockedBalance ?? 0, icon: LockKeyhole },
                { label: "Can Withdraw", value: remainingWithdrawalLimit, icon: WalletIcon },
                { label: "Withdrawn", value: walletSummary?.totalLifetimeWithdrawals ?? 0, icon: ArrowUp },
                { label: "Cap Used", value: capUsedPct, suffix: "%", icon: TrendingUp },
              ].map(({ label, value, suffix, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="wallet-red-muted text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-white">
                    {summaryLoading ? "—" : suffix ? `${value}${suffix}` : formatCompactCurrency(Number(value))}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-48 lg:min-h-64">
            <Image
              src={walletAsset.goldCard}
              alt="SAGENEX gold wallet card"
              width={480}
              height={330}
              className="absolute right-0 top-1/2 w-64 -translate-y-1/2 rotate-[-5deg] drop-shadow-2xl sm:w-80 lg:w-[360px]"
              priority
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">Withdrawal Cap</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">
                {summaryLoading ? "—" : formatCompactCurrency(walletSummary?.withdrawalCap ?? 0)}
              </p>
              <p className="mt-1 text-sm text-[#64748B]">Total limit</p>
            </div>
            <Image src={walletAsset.moneyBag} alt="" width={58} height={58} className="h-14 w-14 object-contain" />
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${capUsedPct}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">Total Withdrawn</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">
                {summaryLoading ? "—" : formatCompactCurrency(walletSummary?.totalLifetimeWithdrawals ?? 0)}
              </p>
              <p className="mt-1 text-sm text-[#64748B]">{formatCompactCurrency(remainingWithdrawalLimit)} remaining</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <ArrowUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:col-span-2 xl:col-span-1">
          <div className="absolute -bottom-8 right-0 h-24 w-40 rounded-full bg-violet-100 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#64748B]">Earnings This Cycle</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">
                {cycleLoading ? "—" : formatCompactCurrency(cycleHistory?.summary?.currentCycleEarnings ?? 0)}
              </p>
              <p className="mt-1 text-sm text-[#64748B]">Current performance</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <svg className="relative mt-5 h-10 w-full text-violet-500" viewBox="0 0 280 48" fill="none" aria-hidden="true">
            <path d="M2 38C35 12 61 25 88 18C121 9 135 6 164 23C193 40 220 39 278 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <TabsList className="h-auto w-max min-w-full justify-start gap-2 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="wallet-red-tab rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="wallet-red-tab rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              SGChain
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="wallet-red-tab rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              Rewards
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="wallet-red-tab rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="lp"
              className="wallet-red-tab rounded-full px-5 py-2.5 text-sm font-bold text-slate-500 shadow-none transition hover:bg-[#FFF1F4] data-[state=active]:bg-[#C8103E] data-[state=active]:text-white data-[state=active]:shadow-none"
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

      <CompoundingProjectionModal />
      </div>
    </div>
  );
};

export default WalletPage;
