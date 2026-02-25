"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import CryptoDeposit from "@/app/components/wallet/CryptoDeposit";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
import { OverviewTab } from "@/app/components/wallet/tabs/OverviewTab";
import { TransferTab } from "@/app/components/wallet/tabs/TransferTab";
import { RewardsTab } from "@/app/components/wallet/tabs/RewardsTab";
import { HistoryTab } from "@/app/components/wallet/tabs/HistoryTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getWalletData, getDashboardData, getKycStatus, getWalletCurrentCycleHistory } from "@/actions/user";
import { KycStatus } from "@/types";
import { X, AlertCircle } from "lucide-react";

// Interfaces for wallet page data
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
    progressAtUnlock?: number | { team?: number; directs?: number; activeLegs?: number; activeTeam?: number; testQualified?: number };
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
    [key: string]: unknown; // Allow other meta fields
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
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatOptionalCurrency = (amount?: number | null) =>
  amount === undefined || amount === null ? "N/A" : formatCurrency(amount);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";


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
  const [kycError, setKycError] = useState<string | null>(null);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(true);
  
  // Drawer states
  const [depositDrawerOpen, setDepositDrawerOpen] = useState(false);
  const [withdrawDrawerOpen, setWithdrawDrawerOpen] = useState(false);
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setWalletLoading(true);
    setDashboardLoading(true);
    setCycleLoading(true);
    setWalletError(null);
    setDashboardError(null);
    setKycError(null);
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
          console.log("Wallet API response:", walletRes);
          const walletPayload = walletRes as WalletLedgerResponse | WalletTransaction[];
          if (Array.isArray(walletPayload)) {
            setTransactions(walletPayload);
          } else {
            setTransactions(walletPayload.ledger || []);
          }
          if (!Array.isArray(walletPayload)) {
            // Try summary nested, then root-level, then data-wrapped
            const raw = walletPayload as Record<string, unknown>;
            const summaryFromPayload =
              walletPayload.summary ??
              ((walletPayload as WalletSummary).availableBalance !== undefined
                ? (walletPayload as WalletSummary)
                : null);
            if (summaryFromPayload) {
              // Extract sgchainStakingBalance from summary, root, or data-wrapped response
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
                dashWallet.sgchainStakingBalance ??
                dashboardRes.sgchainStakingBalance ??
                0,
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
        if (kycData?.error) {
          setKycError(kycData.error);
        } else {
          setKycStatus(kycData);
        }
      } else {
        setKycError("Unable to load KYC status.");
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
    } finally {
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
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const remainingWithdrawalLimit = Math.max(0, walletSummary?.remainingWithdrawalLimit ?? 0);
  const cyclesList = cycleHistory?.cycles ?? [];
  const cycleSummary = cycleHistory?.summary;
  const cycleLedger = cycleHistory?.ledger ?? [];
  const showCycleNote = (cycleSummary?.delta ?? 0) > 0.01;
  const summaryLoading = walletLoading && dashboardLoading;
  const canShowActions = Boolean(walletSummary) && !walletError && !dashboardError;

  const handleDepositSuccess = () => {
    setDepositDrawerOpen(false);
    fetchData();
  };

  const handleWithdrawSuccess = () => {
    setWithdrawDrawerOpen(false);
    fetchData();
  };

  const handleTransferSuccess = () => {
    setTransferDrawerOpen(false);
    fetchData();
  };

  return (
    <div className="bg-black text-white min-h-screen mt-10">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-6">
        {/* Header with Status Badges */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">My Wallet</h1>
            <p className="text-gray-400 mt-1">Manage your funds, view transactions, and upgrade your plan.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {kycStatus && (
              <Badge
                variant={kycStatus.status === "VERIFIED" ? "success" : "warning"}
                className="cursor-pointer"
                onClick={() => router.push("/kyc")}
              >
                KYC: {kycStatus.status === "VERIFIED" ? "Verified" : "Not Verified"}
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              Withdrawal Limit: {formatCurrency(remainingWithdrawalLimit)}
            </Badge>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full grid-cols-4 max-w-md bg-gray-900/40 border border-gray-800 rounded-2xl p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transfer">SGChain</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
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
              onDepositClick={() => setDepositDrawerOpen(true)}
              onWithdrawClick={() => setWithdrawDrawerOpen(true)}
              onTransferClick={() => setTransferDrawerOpen(true)}
              onViewAllTransactions={() => setActiveTab("history")}
            />
          </TabsContent>

          {/* Transfer Tab */}
          <TabsContent value="transfer">
            <TransferTab
              currentBalance={walletSummary?.availableBalance ?? 0}
              onSuccess={fetchData}
            />
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <RewardsTab
              bonuses={walletSummary?.bonuses}
              loading={summaryLoading}
              userId={user?.userId}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <HistoryTab
              transactions={transactions}
              loading={walletLoading}
              error={walletError}
            />
          </TabsContent>
        </Tabs>

        {/* Drawers for Actions */}
        <Drawer open={depositDrawerOpen} onOpenChange={setDepositDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Deposit Funds</DrawerTitle>
              <DrawerDescription>
                Add funds to your wallet using cryptocurrency
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <CryptoDeposit />
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer open={withdrawDrawerOpen} onOpenChange={setWithdrawDrawerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Withdraw Funds</DrawerTitle>
              <DrawerDescription>
                Request a withdrawal from your available balance
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {kycStatus?.status !== "VERIFIED" && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-200 font-medium">KYC Verification Required</p>
                    <p className="text-xs text-amber-200/80 mt-1">
                      You must complete KYC verification before withdrawing funds.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
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
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Transfer Funds</DrawerTitle>
              <DrawerDescription>
                Send funds to another user in your network
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              <p className="text-xs text-gray-400 mb-4">
                Available Balance: {formatCurrency(walletSummary?.availableBalance ?? 0)}
              </p>
              <FundTransfer
                currentBalance={walletSummary?.availableBalance ?? 0}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default WalletPage;
