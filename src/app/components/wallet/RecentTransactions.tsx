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

const formatCurrency = (amount: number, currency = "USDT") =>
  `${amount >= 0 ? "+" : ""}${amount.toFixed(2)} ${currency}`;

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
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        {transactions.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            className="border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10"
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
            <p className="text-gray-500 text-sm mb-4">No transactions yet</p>
            <p className="text-xs text-gray-600">
              Your transaction history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-black/20 hover:bg-black/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      tx.amount > 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {getTransactionTitle(tx)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${
                      tx.amount > 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <p className="text-xs text-gray-500">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
