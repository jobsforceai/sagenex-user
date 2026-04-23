"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

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

export const RecentTransactions = ({
  transactions,
  loading,
  onViewAll,
}: RecentTransactionsProps) => {
  const recentTx = transactions.slice(0, 5);

  return (
    <Card className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold text-[#111827]">Recent Transactions</CardTitle>
        {transactions.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="border-[#E8E8E8] text-[#111827] hover:bg-zinc-50"
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
          <div className="text-center py-8">
            <p className="mb-4 text-sm text-zinc-500">No transactions yet</p>
            <p className="text-xs text-zinc-400">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-3 transition hover:bg-zinc-100/70"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      tx.amount > 0
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-[#C41E3A]/10 text-[#C41E3A]"
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {getTransactionTitle(tx)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-emerald-600" : "text-[#C41E3A]"
                    }`}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <p className="text-xs text-zinc-500">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
