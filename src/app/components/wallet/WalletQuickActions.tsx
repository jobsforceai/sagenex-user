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
    <Card className="h-full rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
      <CardContent className="space-y-3 pt-6">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-400">
          Quick Actions
        </p>
        <Button
          onClick={onWithdraw}
          className="w-full bg-[#C41E3A] font-semibold text-white hover:bg-[#ad1b34]"
        >
          Withdraw
        </Button>
        <Button
          onClick={onTransfer}
          variant="outline"
          className="w-full border-[#E8E8E8] font-semibold text-[#111827] hover:bg-zinc-50"
        >
          Transfer
        </Button>
      </CardContent>
    </Card>
  );
};
