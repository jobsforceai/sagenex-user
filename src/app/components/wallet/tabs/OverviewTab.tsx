"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentTransactions } from "@/app/components/wallet/RecentTransactions";
import { AlertCircle, ArrowUp, ChevronDown, ChevronUp, Info, SendHorizontal } from "lucide-react";
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

const formatCompactCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

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
  const earnedSoFar = cycleSummary?.currentCycleEarnings ?? 0;
  const cycleStart = cycleSummary?.cycleStart ? new Date(cycleSummary.cycleStart) : null;
  const today = new Date();
  const elapsedDays = cycleStart
    ? Math.max(1, Math.ceil((today.getTime() - cycleStart.getTime()) / 86_400_000))
    : Math.max(1, cycleLedger.length);
  const dailyAvg = earnedSoFar / elapsedDays;
  const weeklyAvg = dailyAvg * 7;
  const bestDay = cycleLedger.length > 0 ? Math.max(...cycleLedger.map((entry) => entry.amount)) : 0;
  const activeCycleOption =
    selectedCycleId === "current"
      ? "Current cycle"
      : cyclesList.find((cycle) => cycle.id === selectedCycleId)?.reason || "Selected cycle";

  return (
    <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-6">
          <div className="absolute right-3 top-3 opacity-90 sm:right-4 sm:top-4 sm:opacity-95">
            <Image
              src="/wallet/pink-wallet.png"
              alt="Wallet illustration"
              width={112}
              height={112}
              className="h-14 w-14 object-contain sm:h-28 sm:w-28"
            />
          </div>
          <div className="relative max-w-[calc(100%-92px)] sm:max-w-none">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#64748B] sm:text-[11px] sm:tracking-[0.14em]">
              Available Balance
            </p>
            <p className="mt-2 truncate text-3xl font-black tracking-tight text-[#0F172A] sm:mt-3 sm:text-5xl">
              {summaryLoading ? "—" : formatCurrency(walletSummary?.availableBalance ?? 0)}
            </p>
          </div>
          <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 sm:mt-8 sm:gap-4 sm:pt-5 sm:divide-x sm:divide-slate-100">
            {[
              ["Locked", walletSummary?.capLockedBalance ?? 0],
              ["Can Withdraw", remainingWithdrawalLimit],
              ["Withdrawn", walletSummary?.totalLifetimeWithdrawals ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 sm:px-4 first:sm:pl-0">
                <p className="truncate text-[8px] font-bold uppercase tracking-[0.06em] text-[#64748B] sm:text-xs sm:tracking-[0.08em]">{label}</p>
                <p className="mt-1 truncate text-sm font-black text-[#0F172A] sm:text-lg">
                  {summaryLoading ? "—" : formatCompactCurrency(Number(value))}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="fixed inset-x-3 bottom-[86px] z-40 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)] backdrop-blur lg:static lg:rounded-3xl lg:bg-white lg:p-6 lg:shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="hidden text-lg font-black text-[#0F172A] lg:block">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 lg:mt-5 lg:block lg:space-y-3">
            <button
              type="button"
              onClick={onWithdrawClick}
              disabled={!walletSummary}
              className="wallet-red-control flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] px-3 text-xs font-black text-white shadow-[0_10px_24px_rgba(200,16,62,0.22)] transition hover:from-[#C8103E] hover:to-[#68001A] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/30 disabled:cursor-not-allowed disabled:opacity-50 lg:h-14 lg:gap-2 lg:rounded-2xl lg:px-5 lg:text-sm lg:shadow-[0_14px_30px_rgba(200,16,62,0.22)]"
            >
              <ArrowUp className="h-4 w-4" />
              Withdraw
            </button>
            <button
              type="button"
              onClick={onTransferClick}
              disabled={!walletSummary}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#C8103E]/25 bg-white px-3 text-xs font-black text-[#C8103E] transition hover:bg-[#FFF1F4] focus:outline-none focus:ring-2 focus:ring-[#C8103E]/20 disabled:cursor-not-allowed disabled:opacity-50 lg:h-14 lg:gap-2 lg:rounded-2xl lg:px-5 lg:text-sm"
            >
              <Image src="/wallet/transfer-arrows-crimson.png" alt="" width={22} height={22} className="h-4 w-4 object-contain lg:h-5 lg:w-5" />
              Transfer
            </button>
          </div>
          <div className="mt-5 hidden rounded-2xl bg-[#FFF1F4] p-4 lg:block">
            <div className="flex items-start gap-3">
              <SendHorizontal className="mt-0.5 h-4 w-4 text-[#C8103E]" />
              <p className="text-sm leading-6 text-[#64748B]">
                Move funds through wallet transfers or request withdrawals when your KYC and cap allow it.
              </p>
            </div>
          </div>
        </section>
      </div>

      <CompoundingToggle />

      {(walletError || dashboardError) && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{walletError || dashboardError}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5 text-xs text-indigo-900 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <p><span className="sm:hidden">Locked earnings release after reinvestment.</span><span className="hidden sm:inline">Locked earnings are released when you reinvest and count toward your new cap.</span></p>
      </div>

      <RecentTransactions
        transactions={transactions}
        loading={walletLoading}
        onViewAll={onViewAllTransactions}
      />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl sm:p-6">
        <Image
          src="/wallet/red_wave_no_background.png"
          alt=""
          width={680}
          height={260}
          className="pointer-events-none absolute -bottom-20 right-0 w-[520px] max-w-none opacity-20 hue-rotate-90"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div>
            <p className="text-base font-black text-[#0F172A] sm:text-lg">Earnings This Cycle</p>
            <p className="mt-1 text-xs text-[#64748B]">
              {formatDate(cycleSummary?.cycleStart)} - {formatDate(cycleSummary?.cycleEnd)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {cyclesList.length > 0 && (
              <div className="relative">
                <select
                  id="cycleSelect"
                  value={selectedCycleId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedCycleId(nextId);
                    const params =
                      nextId === "current"
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
                  className="h-10 max-w-44 appearance-none rounded-full border border-slate-200 bg-white px-4 pr-9 text-xs font-bold text-[#0F172A] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  aria-label="Select earnings cycle"
                >
                  <option value="current">Current cycle</option>
                  {cyclesList.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {formatDate(cycle.startedAt)} - {formatDate(cycle.endedAt)} ({cycle.reason || "Completed"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setCycleOpen(!cycleOpen)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {cycleOpen ? "Hide details" : "Show details"}
              {cycleOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-4">
          {[
            ["Earned So Far", formatOptionalCurrency(cycleSummary?.currentCycleEarnings)],
            ["Daily Avg", formatCurrency(dailyAvg)],
            ["Weekly Avg", formatCurrency(weeklyAvg)],
            ["Best Day", formatCurrency(bestDay)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-emerald-100 bg-[#ECFDF5]/80 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700 sm:text-[11px] sm:tracking-[0.1em]">{label}</p>
              <p className="mt-1 truncate text-sm font-black text-[#0F172A] sm:mt-2 sm:text-lg">{cycleLoading ? "—" : value}</p>
            </div>
          ))}
        </div>
        {cycleOpen && (
          <div className="relative mt-5 space-y-4">
            {cycleError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {cycleError}
              </div>
            )}
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#64748B]">{activeCycleOption}</p>
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
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {cycleLedger.map((entry) => (
                  <div key={entry._id} className="flex flex-col gap-2 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-[#0F172A]">{entry.type}</p>
                      <p className="text-xs text-[#64748B]">
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
          </div>
        )}
      </section>
    </div>
  );
};
