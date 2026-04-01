"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WalletQuickActionsProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  withdrawDisabled?: boolean;
}

export const WalletQuickActions = ({
  onDeposit,
  onWithdraw,
  onTransfer,
  withdrawDisabled = false,
}: WalletQuickActionsProps) => {
  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl h-full">
      <CardContent className="pt-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
          Quick Actions
        </p>
        <Button
          onClick={onDeposit}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
        >
          Deposit
        </Button>
        <Button
          onClick={onWithdraw}
          disabled={withdrawDisabled}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
        >
          {withdrawDisabled ? "Withdraw Unavailable" : "Withdraw"}
        </Button>
        <Button
          onClick={onTransfer}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
        >
          Transfer
        </Button>
      </CardContent>
    </Card>
  );
};
