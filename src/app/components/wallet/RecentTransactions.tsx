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
    <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-lg font-black text-[#0F172A]">Recent Transactions</CardTitle>
        {transactions.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="rounded-full border-slate-200 bg-white text-xs font-bold text-[#0F172A] hover:bg-slate-50"
          >
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentTx.length === 0 ? (
          <div className="py-10 text-center">
            <Image
              src="/wallet/pink-wallet.png"
              alt=""
              width={112}
              height={112}
              className="mx-auto h-24 w-24 object-contain opacity-90"
            />
            <p className="mt-3 text-sm font-bold text-[#0F172A]">No transactions yet</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-3 transition hover:border-slate-300 hover:bg-white sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Image
                      src={getTransactionIcon(tx)}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#0F172A]">
                      {getTransactionTitle(tx)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={`text-sm font-black ${
                      tx.amount >= 0 ? "text-emerald-600" : "text-[#C8103E]"
                    }`}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
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
