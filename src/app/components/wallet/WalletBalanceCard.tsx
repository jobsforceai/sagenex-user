"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface WalletBalanceCardProps {
  availableBalance: number;
  sgchainStakingBalance: number;
  lockedBalance: number;
  remainingWithdrawal: number;
  totalWithdrawn: number;
  loading: boolean;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

export const WalletBalanceCard = ({
  availableBalance,
  sgchainStakingBalance,
  lockedBalance,
  remainingWithdrawal,
  totalWithdrawn,
  loading,
}: WalletBalanceCardProps) => {
  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl h-full">
      <CardContent className="pt-6 space-y-6">
        {/* Main Balance */}
        <div className={`flex items-start ${sgchainStakingBalance > 0 ? "gap-5 sm:gap-6" : ""}`}>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70 mb-2">
              Available Balance
            </p>
            {loading ? (
              <Skeleton className="h-14 w-48" />
            ) : (
              <p className="text-4xl sm:text-5xl font-bold text-white">
                {formatCurrency(availableBalance)}
              </p>
            )}
          </div>

          {sgchainStakingBalance > 0 && (
            <>
              <div className="self-stretch w-px bg-gray-700/60" />
              <div className="min-w-0 shrink-0">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70 mb-2 flex items-center gap-1.5">
                  SGChain Staking
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-amber-200/50 hover:text-amber-200 cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-xs">
                        Amount transferred from SGChain. This balance is staked and locked.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </p>
                {loading ? (
                  <Skeleton className="h-14 w-36" />
                ) : (
                  <p className="text-4xl sm:text-5xl font-bold text-amber-100">
                    {formatCurrency(sgchainStakingBalance)}
                  </p>
                )}
              </div>
            </>
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
