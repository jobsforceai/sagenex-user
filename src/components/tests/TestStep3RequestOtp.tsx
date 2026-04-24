/**
 * Test Booking Stepper - Step 3: Request OTP
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Clock } from 'lucide-react';
import { getDashboardData } from '@/actions/user';

interface TestStep3Props {
  onRequest: () => Promise<boolean>;
  onBack: () => void;
  onSkip?: () => void;
  otpValidUntil: Date | null;
  message: string | null;
  error: string | null;
  loading: boolean;
  priceUSD?: number;
}

export function TestStep3RequestOtp({
  onRequest,
  onBack,
  onSkip,
  otpValidUntil,
  message,
  error,
  loading,
  priceUSD,
}: TestStep3Props) {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const formattedPrice = useMemo(() => {
    if (typeof priceUSD === 'number') {
      return `₹${priceUSD.toFixed(2)}`;
    }
    return 'Test fee';
  }, [priceUSD]);

  const formattedBalance = useMemo(() => {
    if (typeof availableBalance === 'number') {
      return `₹${availableBalance.toFixed(2)}`;
    }
    return null;
  }, [availableBalance]);

  const isBalanceLoading = availableBalance === null && !balanceError;
  const isBalanceKnown = typeof availableBalance === 'number';
  const insufficientBalance =
    typeof priceUSD === 'number' && isBalanceKnown && availableBalance < priceUSD;

  // Resend cooldown timer (60 seconds)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await getDashboardData();
        if (res.error) {
          setBalanceError(res.error);
          return;
        }
        const balance = res.wallet?.availableBalance;
        setAvailableBalance(typeof balance === 'number' ? balance : null);
      } catch (err: any) {
        setBalanceError(err?.message || 'Failed to load wallet balance.');
      }
    };

    fetchBalance();
  }, []);

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
    if (insufficientBalance || isBalanceLoading) {
      return;
    }
    const success = await onRequest();
    if (!success) return;
    setOtpSent(true);
    setResendCooldown(60);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-white">Choose Verification</h2>
        <p className="text-white/70 text-sm">
          Pick how you want to verify this booking. You can use a password or request an OTP.
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

      {insufficientBalance && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Insufficient wallet balance. You need {formattedPrice}, but have {formattedBalance || '₹0.00'}.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 space-y-2">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/70" />
          <div>
            <p className="font-semibold text-white/80">Security Verification</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• OTP is valid for 10 minutes (if requested)</li>
              <li>• Amount: {formattedPrice} will be charged</li>
              <li>• You'll enter OTP or password in the next step</li>
              <li>• Can resend OTP after 60 seconds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Request OTP Button */}
      {!otpSent && (
        <div className="space-y-3">
          {onSkip && (
            <Button
              type="button"
              onClick={onSkip}
              disabled={loading || insufficientBalance || isBalanceLoading}
              className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95 disabled:opacity-60"
            >
              Use Password
            </Button>
          )}
          <Button
            onClick={handleRequestOtp}
            disabled={loading || insufficientBalance || isBalanceLoading}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/5 disabled:opacity-60"
          >
            {isBalanceLoading ? 'Checking balance...' : loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        </div>
      )}

      {/* Resend OTP Button */}
      {otpSent && (
        <div className="space-y-3">
          <Button
            onClick={handleRequestOtp}
            disabled={loading || resendCooldown > 0 || insufficientBalance || isBalanceLoading}
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
