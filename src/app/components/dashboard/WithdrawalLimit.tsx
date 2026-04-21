"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote } from "lucide-react";

interface WithdrawalLimitProps {
  withdrawalCap: number;
  totalLifetimeWithdrawals: number;
  remainingWithdrawalLimit: number;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const WithdrawalLimit = ({
  withdrawalCap,
  totalLifetimeWithdrawals,
  remainingWithdrawalLimit,
}: WithdrawalLimitProps) => {
  const progressPercentage = withdrawalCap > 0
    ? Math.min(100, Math.max(0, (totalLifetimeWithdrawals / withdrawalCap) * 100))
    : 0;
  const safeRemaining = Math.max(0, remainingWithdrawalLimit);

  return (
    <Card className="bg-[#0b0b0b] border border-blue-900/40 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          Lifetime Withdrawal Limit
        </CardTitle>
        <Banknote className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="w-full bg-gray-700 rounded-full h-2.5 my-4">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Withdrawn:</span>
            <span className="font-bold text-white">
              {formatCurrency(totalLifetimeWithdrawals)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Remaining:</span>
            <span className="font-bold text-green-400">
              {formatCurrency(safeRemaining)}
            </span>
          </div>
          <div className="flex justify-between border-t border-dashed border-gray-700 pt-2 mt-2">
            <span className="text-gray-400">Max Limit:</span>
            <span className="font-bold text-white">
              {formatCurrency(withdrawalCap)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WithdrawalLimit;
