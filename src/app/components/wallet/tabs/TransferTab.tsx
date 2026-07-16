"use client";

import TransferToSGChain from "@/app/components/wallet/TransferToSGChain";

interface TransferTabProps {
  currentBalance: number;
  onSuccess: () => void;
}

export const TransferTab = ({ currentBalance, onSuccess }: TransferTabProps) => {
  void onSuccess;

  return (
    <div className="space-y-6 mt-6">
      <TransferToSGChain currentBalance={currentBalance} />
    </div>
  );
};
