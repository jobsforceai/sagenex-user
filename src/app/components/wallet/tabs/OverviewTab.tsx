"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletBalanceCard } from "@/app/components/wallet/WalletBalanceCard";
import { WalletQuickActions } from "@/app/components/wallet/WalletQuickActions";
import { RecentTransactions } from "@/app/components/wallet/RecentTransactions";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { getWalletCurrentCycleHistory } from "@/actions/user";
import { CompoundingToggle } from "@/app/components/wallet/CompoundingToggle";

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
  onWithdrawClick: () => void;
  onTransferClick: () => void;
  onViewAllTransactions: () => void;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

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
          onWithdraw={onWithdrawClick}
          onTransfer={onTransferClick}
        />
      </div>

      {/* Compounding Toggle */}
      <CompoundingToggle />

      {/* Error Messages */}
      {(walletError || dashboardError) && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{walletError || dashboardError}</p>
          </CardContent>
        </Card>
      )}

      {/* Helper Text */}
      <p className="px-1 text-xs text-zinc-500">
        Locked earnings are released when you reinvest and count toward your new cap.
      </p>

      {/* Recent Transactions */}
      <RecentTransactions
        transactions={transactions}
        loading={walletLoading}
        onViewAll={onViewAllTransactions}
      />

      {/* Current Cycle Earnings */}
      <Card className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
        <CardHeader className="space-y-4 border-b border-[#E8E8E8]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-[#111827]">Earnings This Cycle</CardTitle>
              <p className="text-xs text-zinc-500">
                {formatDate(cycleSummary?.cycleStart)} - {formatDate(cycleSummary?.cycleEnd)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCycleOpen(!cycleOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              {cycleOpen ? "Hide details" : "Show details"}
              {cycleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">Earned so far</p>
              <p className="mt-2 text-2xl font-black text-[#111827]">
                {cycleLoading ? "—" : formatOptionalCurrency(cycleSummary?.currentCycleEarnings)}
              </p>
            </div>
            {cyclesList.length > 0 && (
              <div className="flex flex-col gap-2">
                <label htmlFor="cycleSelect" className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
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
                    className="w-full appearance-none rounded-xl border border-[#E8E8E8] bg-white px-4 py-3 text-sm text-[#111827] focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="current">Current cycle</option>
                    {cyclesList.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {formatDate(cycle.startedAt)} - {formatDate(cycle.endedAt)} ({cycle.reason || "Completed"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        {cycleOpen && (
          <CardContent className="space-y-4">
            {cycleError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {cycleError}
              </div>
            )}
            {showCycleNote && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                Includes locked earnings released after reinvestment.
              </div>
            )}

            {cycleLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : cycleLedger.length === 0 ? (
              <p className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-3 text-sm text-zinc-500">
                No earnings recorded for this cycle yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E8E8] rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA]">
                {cycleLedger.map((entry) => (
                  <div key={entry._id} className="flex flex-col gap-2 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#111827]">{entry.type}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={entry.amount >= 0 ? "text-emerald-600" : "text-[#C41E3A]"}>
                        {entry.amount >= 0 ? "+" : ""}
                        {formatCurrency(entry.amount)}
                      </p>
                      <p className="text-xs text-zinc-500">{entry.status}</p>
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
