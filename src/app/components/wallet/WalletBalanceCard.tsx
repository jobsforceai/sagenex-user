"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletBalanceCardProps {
  availableBalance: number;
  lockedBalance: number;
  remainingWithdrawal: number;
  totalWithdrawn: number;
  loading: boolean;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const WalletBalanceCard = ({
  availableBalance,
  lockedBalance,
  remainingWithdrawal,
  totalWithdrawn,
  loading,
}: WalletBalanceCardProps) => {
  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl h-full">
      <CardContent className="pt-6 space-y-6">
        {/* Main Balance */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70 mb-2">
            Available Balance
          </p>
          {loading ? (
            <Skeleton className="h-14 w-48" />
          ) : (
            <p className="text-5xl font-bold text-white">
              {formatCurrency(availableBalance)}
            </p>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Locked
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-gray-300">
                {formatCurrency(lockedBalance)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Can Withdraw
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-gray-300">
                {formatCurrency(remainingWithdrawal)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Withdrawn
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-gray-300">
                {formatCurrency(totalWithdrawn)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
