"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletBalanceCard } from "@/app/components/wallet/WalletBalanceCard";
import { WalletQuickActions } from "@/app/components/wallet/WalletQuickActions";
import { RecentTransactions } from "@/app/components/wallet/RecentTransactions";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getWalletCurrentCycleHistory } from "@/actions/user";

interface WalletSummary {
  availableBalance: number;
  sgchainStakingBalance?: number;
  capLockedBalance?: number;
  totalLifetimeWithdrawals?: number;
  remainingWithdrawalLimit?: number;
}

interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description?: string;
  currency?: string;
  meta?: {
    senderName?: string;
    recipientName?: string;
    bonusType?: string;
    [key: string]: unknown;
  };
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

interface OverviewTabProps {
  walletSummary: WalletSummary | null;
  transactions: WalletTransaction[];
  cycleHistory: CurrentCycleHistory | null;
  selectedCycleId: string;
  setSelectedCycleId: (id: string) => void;
  cycleOpen: boolean;
  setCycleOpen: (open: boolean) => void;
  walletError: string | null;
  dashboardError: string | null;
  cycleError: string | null;
  summaryLoading: boolean;
  walletLoading: boolean;
  cycleLoading: boolean;
  setCycleLoading: (loading: boolean) => void;
  setCycleError: (error: string | null) => void;
  setCycleHistory: (history: CurrentCycleHistory | null) => void;
  remainingWithdrawalLimit: number;
  withdrawalsDisabled?: boolean;
  onDepositClick: () => void;
  onWithdrawClick: () => void;
  onTransferClick: () => void;
  onViewAllTransactions: () => void;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatOptionalCurrency = (amount?: number | null) =>
  amount === undefined || amount === null ? "N/A" : formatCurrency(amount);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "N/A";

export const OverviewTab = ({
  walletSummary,
  transactions,
  cycleHistory,
  selectedCycleId,
  setSelectedCycleId,
  cycleOpen,
  setCycleOpen,
  walletError,
  dashboardError,
  cycleError,
  summaryLoading,
  walletLoading,
  cycleLoading,
  setCycleLoading,
  setCycleError,
  setCycleHistory,
  remainingWithdrawalLimit,
  withdrawalsDisabled = false,
  onDepositClick,
  onWithdrawClick,
  onTransferClick,
  onViewAllTransactions,
}: OverviewTabProps) => {
  const cyclesList = cycleHistory?.cycles ?? [];
  const cycleSummary = cycleHistory?.summary;
  const cycleLedger = cycleHistory?.ledger ?? [];
  const showCycleNote = (cycleSummary?.delta ?? 0) > 0.01;

  return (
    <div className="space-y-6 mt-6">
      {/* Top Section: Balance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WalletBalanceCard
            availableBalance={walletSummary?.availableBalance ?? 0}
            sgchainStakingBalance={walletSummary?.sgchainStakingBalance ?? 0}
            lockedBalance={walletSummary?.capLockedBalance ?? 0}
            remainingWithdrawal={remainingWithdrawalLimit}
            totalWithdrawn={walletSummary?.totalLifetimeWithdrawals ?? 0}
            loading={summaryLoading}
          />
        </div>
        <WalletQuickActions
          onDeposit={onDepositClick}
          onWithdraw={onWithdrawClick}
          onTransfer={onTransferClick}
          withdrawDisabled={withdrawalsDisabled}
        />
      </div>

      {/* Error Messages */}
      {(walletError || dashboardError) && (
        <Card className="bg-red-500/10 border border-red-500/30">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{walletError || dashboardError}</p>
          </CardContent>
        </Card>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500 px-1">
        Locked earnings are released when you reinvest and count toward your new cap.
      </p>

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={transactions}
        loading={walletLoading}
        onViewAll={onViewAllTransactions}
      />

      {/* Current Cycle Earnings */}
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader className="space-y-4 border-b border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Earnings This Cycle</CardTitle>
              <p className="text-xs text-gray-500">
                {formatDate(cycleSummary?.cycleStart)} - {formatDate(cycleSummary?.cycleEnd)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCycleOpen(!cycleOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/60 hover:text-emerald-100"
            >
              {cycleOpen ? "Hide details" : "Show details"}
              {cycleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-gray-200">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-200/70">Earned so far</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {cycleLoading ? "—" : formatOptionalCurrency(cycleSummary?.currentCycleEarnings)}
              </p>
            </div>
            {cyclesList.length > 0 && (
              <div className="flex flex-col gap-2">
                <label htmlFor="cycleSelect" className="text-xs uppercase tracking-[0.25em] text-gray-500">
                  Cycle
                </label>
                <div className="relative">
                  <select
                    id="cycleSelect"
                    value={selectedCycleId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setSelectedCycleId(nextId);
                      const params = nextId === "current"
                        ? { includeCycles: true, cyclesLimit: 5 }
                        : { includeCycles: true, cyclesLimit: 5, cycleId: nextId };
                      setCycleLoading(true);
                      setCycleError(null);
                      getWalletCurrentCycleHistory(params)
                        .then((res) => {
                          if (res?.error) {
                            setCycleError(res.error);
                            setCycleHistory(null);
                          } else {
                            setCycleHistory(res?.summary ? res : null);
                          }
                        })
                        .catch(() => setCycleError("Unable to load cycle earnings."))
                        .finally(() => setCycleLoading(false));
                    }}
                    className="w-full appearance-none rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-sm text-gray-200 focus:border-emerald-400/60 focus:outline-none"
                  >
                    <option value="current">Current cycle</option>
                    {cyclesList.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {formatDate(cycle.startedAt)} - {formatDate(cycle.endedAt)} ({cycle.reason || "Completed"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        {cycleOpen && (
          <CardContent className="space-y-4">
            {cycleError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                {cycleError}
              </div>
            )}
            {showCycleNote && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                Includes locked earnings released after reinvestment.
              </div>
            )}

            {cycleLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : cycleLedger.length === 0 ? (
              <p className="rounded-xl border border-gray-800 bg-black/20 px-4 py-3 text-sm text-gray-500">
                No earnings recorded for this cycle yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-800 rounded-2xl border border-gray-800 bg-black/30">
                {cycleLedger.map((entry) => (
                  <div key={entry._id} className="flex flex-col gap-2 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{entry.type}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={entry.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                        {entry.amount >= 0 ? "+" : ""}
                        {formatCurrency(entry.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{entry.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};
