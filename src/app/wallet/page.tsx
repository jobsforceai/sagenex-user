"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import { CompoundingProjectionModal } from "@/app/components/wallet/CompoundingProjectionModal";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
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
import { AlertCircle, ArrowUp, BadgeDollarSign, Wallet as WalletIcon } from "lucide-react";

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
    <div className="dashboard-light-scope space-y-5 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#111827]">Wallet</h1>
          <p className="mt-1 text-[17px] text-zinc-500">
            Manage your balance, transfers and history
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {kycStatus && (
            <button
              type="button"
              onClick={() => router.push("/kyc")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                kycStatus.status === "VERIFIED"
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  kycStatus.status === "VERIFIED" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {kycStatus.status === "VERIFIED" ? "KYC Verified" : "KYC Pending"}
            </button>
          )}
          <Button
            onClick={() => setWithdrawDrawerOpen(true)}
            className="rounded-xl bg-[#C41E3A] px-5 text-white hover:bg-[#ad1b34]"
            disabled={!walletSummary}
          >
            <ArrowUp className="mr-1.5 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              Available Balance
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C41E3A]/10 text-[#C41E3A]">
              <WalletIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[42px] font-black leading-none tracking-tight text-[#111827]">
            {summaryLoading ? "—" : formatCurrency(walletSummary?.availableBalance ?? 0)}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-600">{capUsedPct}% cap used</p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              Withdrawal Cap
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <BadgeDollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[42px] font-black leading-none tracking-tight text-[#111827]">
            {summaryLoading ? "—" : formatCurrency(walletSummary?.withdrawalCap ?? 0)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">Total limit</p>
        </div>

        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              Total Withdrawn
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <ArrowUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[42px] font-black leading-none tracking-tight text-[#111827]">
            {summaryLoading ? "—" : formatCurrency(walletSummary?.totalLifetimeWithdrawals ?? 0)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {formatCurrency(remainingWithdrawalLimit)} remaining
          </p>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="rounded-2xl border border-[#E8E8E8] bg-white px-4 pt-3 shadow-sm">
          <TabsList className="h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-[#E8E8E8] bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#C41E3A] data-[state=active]:bg-transparent data-[state=active]:text-[#C41E3A] data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#C41E3A] data-[state=active]:bg-transparent data-[state=active]:text-[#C41E3A] data-[state=active]:shadow-none"
            >
              SGChain
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#C41E3A] data-[state=active]:bg-transparent data-[state=active]:text-[#C41E3A] data-[state=active]:shadow-none"
            >
              Rewards
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#C41E3A] data-[state=active]:bg-transparent data-[state=active]:text-[#C41E3A] data-[state=active]:shadow-none"
            >
              History
            </TabsTrigger>
            <TabsTrigger
              value="lp"
              className="rounded-none border-b-2 border-transparent bg-transparent px-1 pb-2.5 pt-0 text-sm font-semibold text-zinc-500 shadow-none data-[state=active]:border-[#C41E3A] data-[state=active]:bg-transparent data-[state=active]:text-[#C41E3A] data-[state=active]:shadow-none"
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
  );
};

export default WalletPage;
