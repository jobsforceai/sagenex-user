/**
 * Wallet Transfer Stepper - Step 2: Request OTP
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';

interface Step2Props {
  onRequest: () => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
  loading?: boolean;
  error?: string | null;
  message?: string | null;
  otpValidUntil?: Date;
}

export function Step2RequestOtp({
  onRequest,
  onBack,
  onSkip,
  loading,
  error,
  message,
  otpValidUntil,
}: Step2Props) {
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // OTP validity countdown (10 minutes)
  useEffect(() => {
    if (!otpValidUntil) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = otpValidUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpValidUntil]);

  // Resend cooldown (60 seconds)
  useEffect(() => {
    if (!resendDisabled) return;

    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendDisabled]);

  const handleRequest = async () => {
    try {
      await onRequest();
      setResendDisabled(true);
      setResendCountdown(60);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Message/Error */}
      {message && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-200 flex items-start gap-3">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{message}</p>
            {timeRemaining && (
              <p className="text-xs text-emerald-300 mt-1">Valid until: {timeRemaining}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
        <p>
          An OTP will be sent to your registered email. You have <strong>10 minutes</strong> to verify and
          complete the transfer.
        </p>
        {onSkip && (
          <p className="mt-2 text-xs text-white/50">Prefer password verification? You can continue without OTP.</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
        >
          Back
        </Button>
        <Button
          onClick={handleRequest}
          disabled={loading || resendDisabled}
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95 disabled:opacity-60"
        >
          {loading ? 'Sending...' : resendDisabled ? `Resend in ${resendCountdown}s` : 'Send OTP'}
        </Button>
      </div>
      {onSkip && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={loading}
          className="w-full text-sm text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-50"
        >
          Use password instead
        </Button>
      )}
    </div>
  );
}
