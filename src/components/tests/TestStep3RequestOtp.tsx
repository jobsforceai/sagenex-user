/**
 * Test Booking Stepper - Step 3: Request OTP
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Clock } from 'lucide-react';

interface TestStep3Props {
  onRequest: () => Promise<void>;
  onBack: () => void;
  otpValidUntil: Date | null;
  message: string | null;
  error: string | null;
  loading: boolean;
}

export function TestStep3RequestOtp({
  onRequest,
  onBack,
  otpValidUntil,
  message,
  error,
  loading,
}: TestStep3Props) {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // Resend cooldown timer (60 seconds)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // OTP validity countdown
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  useEffect(() => {
    if (!otpValidUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = new Date(otpValidUntil).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('OTP Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpValidUntil]);

  const handleRequestOtp = async () => {
    await onRequest();
    setOtpSent(true);
    setResendCooldown(60);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-white">Request OTP</h2>
        <p className="text-white/70 text-sm">
          We'll send a one-time password to your registered email/phone for verification before processing the $50 payment.
        </p>
      </div>

      {/* Success Message */}
      {message && otpSent && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-200 flex items-start gap-3">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{message}</p>
            {otpValidUntil && (
              <p className="text-xs mt-1">
                Valid for: <span className="font-mono">{timeRemaining}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 text-sm text-blue-200 space-y-2">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Security Verification Required</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• OTP is valid for 10 minutes</li>
              <li>• Amount: $50 will be charged</li>
              <li>• You'll enter OTP + password in the next step</li>
              <li>• Can resend OTP after 60 seconds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Request OTP Button */}
      {!otpSent && (
        <Button
          onClick={handleRequestOtp}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95 disabled:opacity-60"
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      )}

      {/* Resend OTP Button */}
      {otpSent && (
        <div className="space-y-3">
          <Button
            onClick={handleRequestOtp}
            disabled={loading || resendCooldown > 0}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/5 disabled:opacity-40"
          >
            {resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : loading
              ? 'Sending...'
              : 'Resend OTP'}
          </Button>

          <Button
            onClick={() => {
              /* Proceed to next step handled by parent */
            }}
            className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
          >
            Proceed to Enter OTP
          </Button>
        </div>
      )}

      {/* Back Button */}
      <Button
        onClick={onBack}
        disabled={loading}
        variant="outline"
        className="w-full border-white/20 text-white hover:bg-white/5"
      >
        Back to Location
      </Button>
    </div>
  );
}
