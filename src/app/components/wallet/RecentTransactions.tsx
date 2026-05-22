"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

interface RecentTransactionsProps {
  transactions: WalletTransaction[];
  loading: boolean;
  onViewAll: () => void;
}

const formatCurrency = (amount: number, currency = "INR") =>
  `${amount >= 0 ? "+" : ""}₹${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

const getTransactionTitle = (tx: WalletTransaction) => {
  if (tx.description) return tx.description;
  if (tx.type === "ROI_UPLINE_BONUS") return "ROI Upline Bonus";
  if (tx.type === "UNILEVEL" && tx.meta?.bonusType === "REINVESTMENT") return "Reinvestment Bonus";
  if (tx.type === "BONUS_UNLOCK") return "Bonus Unlocked";
  if (tx.type === "ROI") return "Special Bonus";
  return tx.type;
};

const getTransactionIcon = (tx: WalletTransaction) => {
  if (tx.type.includes("LOCK")) return "/wallet/lock-mint.png";
  return tx.amount >= 0 ? "/wallet/incoming-arrow-mint.png" : "/wallet/outgoing-arrow-crimson.png";
};

export const RecentTransactions = ({
  transactions,
  loading,
  onViewAll,
}: RecentTransactionsProps) => {
  const recentTx = transactions.slice(0, 5);

  return (
    <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 pb-2 pt-3 sm:px-6 sm:pb-3 sm:pt-6">
        <CardTitle className="text-sm font-black text-[#0F172A] sm:text-lg">Recent Transactions</CardTitle>
        {transactions.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="h-7 rounded-full border-slate-200 bg-white px-2.5 text-[10px] font-bold text-[#0F172A] hover:bg-slate-50 sm:h-8 sm:px-3 sm:text-xs"
          >
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentTx.length === 0 ? (
          <div className="py-8 text-center sm:py-10">
            <Image
              src="/wallet/pink-wallet.png"
              alt=""
              width={112}
              height={112}
              className="mx-auto h-20 w-20 object-contain opacity-90 sm:h-24 sm:w-24"
            />
            <p className="mt-3 text-sm font-bold text-[#0F172A]">No transactions yet</p>
            <p className="mt-1 hidden text-xs text-[#64748B] sm:block">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-3">
            {recentTx.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between gap-1.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-2 transition hover:border-slate-300 hover:bg-white sm:gap-3 sm:rounded-2xl sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-11 sm:w-11">
                    <Image
                      src={getTransactionIcon(tx)}
                      alt=""
                      width={32}
                      height={32}
                      className="h-5 w-5 object-contain sm:h-8 sm:w-8"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-[#0F172A] sm:text-sm">
                      {getTransactionTitle(tx)}
                    </p>
                    <p className="mt-0.5 hidden text-xs text-[#64748B] sm:block">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-[10px] font-black sm:text-sm ${
                      tx.amount >= 0 ? "text-emerald-600" : "text-[#C8103E]"
                    }`}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.04em] text-[#64748B] sm:text-[11px] sm:tracking-[0.08em]">
                    {tx.status || "POSTED"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
