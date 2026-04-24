/**
 * Wallet Transfer Stepper - Step 4: Confirmation
 */

'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface Step4Props {
  amount: number;
  recipientId: string;
  transactionId: string;
  onFinish: () => void;
}

export function Step4Confirmation({
  amount,
  recipientId,
  transactionId,
  onFinish,
}: Step4Props) {
  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-pulse">
          <Check className="w-8 h-8 text-emerald-300" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Transfer Complete!</h3>
        <p className="text-white/70">Your transfer has been successfully processed.</p>
      </div>

      {/* Summary */}
      <div className="space-y-3 p-6 rounded-lg bg-white/5 border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Transfer ID:</span>
          <span className="text-white font-mono text-sm">{transactionId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Amount:</span>
          <span className="text-white font-semibold">₹{amount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Recipient:</span>
          <span className="text-white font-semibold">{recipientId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Time:</span>
          <span className="text-white text-sm">{new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-200">
        <p>The transfer has been debited from your account and credited to the recipient.</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          onClick={onFinish}
          className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
        >
          View Wallet
        </Button>
        <Link href="/wallet" className="w-full">
          <Button
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/5"
          >
            Make Another Transfer
          </Button>
        </Link>
      </div>
    </div>
  );
}
