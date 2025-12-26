/**
 * Test Booking Stepper - Step 5: Confirmation
 */

'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface TestStep5Props {
  bookingId: string;
  transactionId: string;
  onFinish: () => void;
}

export function TestStep5Confirmation({
  bookingId,
  transactionId,
  onFinish,
}: TestStep5Props) {
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
        <h3 className="text-2xl font-bold text-white mb-2">Test Booked Successfully!</h3>
        <p className="text-white/70">Your test booking has been confirmed and a $50 fee has been charged.</p>
      </div>

      {/* Summary */}
      <div className="space-y-3 p-6 rounded-lg bg-white/5 border border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-white/70">Booking ID:</span>
          <span className="text-white font-mono text-sm">{bookingId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Transaction ID:</span>
          <span className="text-white font-mono text-sm">{transactionId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Status:</span>
          <span className="text-white px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold">
            PENDING
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Fee:</span>
          <span className="text-white font-semibold">$50.00</span>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 text-sm text-blue-200 space-y-2">
        <p>
          <strong>Booking submitted successfully!</strong> An admin will review your details and schedule the test date.
        </p>
        <p>
          A confirmation email with your scheduled test date and time will be sent to your registered email address.
        </p>
        <p className="text-xs">You can cancel this booking at any time for a full refund.</p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 pt-4">
        <Button
          onClick={onFinish}
          className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
        >
          View All Bookings
        </Button>
        <Link href="/dashboard" className="w-full">
          <Button
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/5"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
