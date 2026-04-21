"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WalletQuickActionsProps {
  onWithdraw: () => void;
  onTransfer: () => void;
}

export const WalletQuickActions = ({
  onWithdraw,
  onTransfer,
}: WalletQuickActionsProps) => {
  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl h-full">
      <CardContent className="pt-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
          Quick Actions
        </p>
        <Button
          onClick={onWithdraw}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
        >
          Withdraw
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
