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
    <Card className="h-full rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
      <CardContent className="space-y-6 pt-6">
        {/* Main Balance */}
        <div className={`flex items-start ${sgchainStakingBalance > 0 ? "gap-5 sm:gap-6" : ""}`}>
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
              Available Balance
            </p>
            {loading ? (
              <Skeleton className="h-14 w-48" />
            ) : (
              <p className="text-4xl font-black tracking-tight text-[#111827] sm:text-5xl">
                {formatCurrency(availableBalance)}
              </p>
            )}
          </div>

          {sgchainStakingBalance > 0 && (
            <>
              <div className="self-stretch w-px bg-gray-700/60" />
              <div className="min-w-0 shrink-0">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                  SGChain Staking
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 cursor-help text-zinc-400 transition-colors hover:text-zinc-500" />
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
                  <p className="text-4xl font-black tracking-tight text-amber-600 sm:text-5xl">
                    {formatCurrency(sgchainStakingBalance)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-[#E8E8E8] pt-4">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">
              Locked
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-[#111827]">
                {formatCurrency(lockedBalance)}
              </p>
            )}
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">
              Can Withdraw
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-[#111827]">
                {formatCurrency(remainingWithdrawal)}
              </p>
            )}
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">
              Withdrawn
            </p>
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <p className="text-sm font-semibold text-[#111827]">
                {formatCurrency(totalWithdrawn)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
