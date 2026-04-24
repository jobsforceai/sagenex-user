/**
 * Test Booking Stepper - Review & Confirm with OTP or password
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check } from 'lucide-react';
import { TestBookingBasicInfo, TestBookingOtp, testBookingOtpSchema } from '@/lib/validation';
import type { TestCatalogItem, TestCatalogLocation } from '@/types/tests';
import { useAuth } from '@/app/context/AuthContext';

interface TestStep4Props {
  userInfo: TestBookingBasicInfo;
  test?: TestCatalogItem;
  locationDetails?: TestCatalogLocation;
  onRequestOtp?: () => Promise<boolean>;
  otpValidUntil?: Date | null;
  otpMessage?: string | null;
  onConfirm: (data: TestBookingOtp) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function TestStep4ReviewConfirm({
  userInfo,
  test,
  locationDetails,
  onRequestOtp,
  otpValidUntil,
  otpMessage,
  onConfirm,
  onBack,
  loading,
  error,
}: TestStep4Props) {
  const { user } = useAuth();
  const canUsePassword = user?.hasPasswordSet !== false;
  const [verificationMethod, setVerificationMethod] = useState<'password' | 'otp'>(
    canUsePassword ? 'password' : 'otp'
  );
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TestBookingOtp>({
    resolver: zodResolver(testBookingOtpSchema),
  });

  useEffect(() => {
    if (!canUsePassword && verificationMethod === 'password') {
      setVerificationMethod('otp');
    }
  }, [canUsePassword, verificationMethod]);

  useEffect(() => {
    if (verificationMethod === 'otp') {
      setValue('password', '');
    } else {
      setValue('otp', '');
      setOtpSent(false);
      setResendCooldown(0);
    }
  }, [verificationMethod, setValue]);

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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!onRequestOtp) return;
    const success = await onRequestOtp();
    if (!success) return;
    setOtpSent(true);
    setResendCooldown(60);
  };

  const hiddenFieldError =
    verificationMethod === 'otp' ? errors.password?.message : errors.otp?.message;

  return (
    <form onSubmit={handleSubmit(onConfirm)} className="space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* User Info */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
        <h3 className="font-semibold text-white mb-3">Personal Information</h3>
        <div className="flex justify-between">
          <span className="text-white/70">Name:</span>
          <span className="text-white">
            {userInfo.firstName} {userInfo.lastName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Email:</span>
          <span className="text-white">{userInfo.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Phone:</span>
          <span className="text-white">{userInfo.phone}</span>
        </div>
        {userInfo.age && (
          <div className="flex justify-between">
            <span className="text-white/70">Age:</span>
            <span className="text-white">{userInfo.age}</span>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
        <h3 className="font-semibold text-white mb-3">Test Location</h3>
        <div className="flex justify-between">
          <span className="text-white/70">Location:</span>
          <span className="text-white">{locationDetails?.name || 'Selected location'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Address:</span>
          <span className="text-white">
            {locationDetails
              ? `${locationDetails.address}, ${locationDetails.city}, ${locationDetails.state} ${locationDetails.zipCode}`
              : '—'}
          </span>
        </div>
        {locationDetails && (
          <div className="flex justify-between">
            <span className="text-white/70">Coordinates:</span>
            <span className="text-white text-xs font-mono">
              {locationDetails.latitude.toFixed(4)}, {locationDetails.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Test Details */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
        <h3 className="font-semibold text-white mb-3">Test Details</h3>
        <div className="flex justify-between">
          <span className="text-white/70">Test:</span>
          <span className="text-white">{test?.heading || test?.subheading || 'Selected test'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Fee:</span>
          <span className="text-white font-semibold">
            {test ? `₹${test.priceUSD.toFixed(2)}` : '—'}
          </span>
        </div>
        {test?.scheduledAt && (
          <div className="flex justify-between">
            <span className="text-white/70">Scheduled At:</span>
            <span className="text-white">{new Date(test.scheduledAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Admin Scheduling Notice */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 text-sm text-blue-200">
        <p className="mb-2">
          <strong>Next Step:</strong> Your test booking is being processed. An admin will review your details and schedule
          the test date. You'll receive a confirmation email with the scheduled date and time.
        </p>
        <p>
          By confirming, you agree to pay the test fee for this booking. This amount will be deducted from your
          wallet balance. You can cancel this booking at any time to receive a refund.
        </p>
      </div>

      {/* OTP or Password Fields */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-semibold text-white mb-3">Security Verification</h3>
        <p className="text-xs text-white/60">
          Use OTP or password to confirm your booking (one only).
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {canUsePassword && (
            <Button
              type="button"
              onClick={() => setVerificationMethod('password')}
              className={
                verificationMethod === 'password'
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95'
                  : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
              }
            >
              Use Password
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setVerificationMethod('otp')}
            className={
              verificationMethod === 'otp'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95'
                : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
            }
          >
            Use OTP
          </Button>
        </div>

        {hiddenFieldError && (
          <div className="text-xs text-red-400">{hiddenFieldError}</div>
        )}

        {verificationMethod === 'otp' ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="otp" className="text-white">OTP (6 digits)</Label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <Input
                  id="otp"
                  inputMode="numeric"
                  {...register('otp')}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
                />
                {onRequestOtp && (
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-60 sm:w-48"
                  >
                    {loading
                      ? 'Sending...'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Send OTP'}
                  </Button>
                )}
              </div>
              {errors.otp && (
                <p className="text-xs text-red-400 mt-2">{errors.otp.message}</p>
              )}
            </div>

            {otpMessage && otpSent && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200 flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-semibold">{otpMessage}</p>
                  {otpValidUntil && (
                    <p className="mt-1 text-emerald-200/80">
                      Valid for: <span className="font-mono">{timeRemaining}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="Enter your password"
              className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
            <p className="text-xs text-white/50">Your password is never stored.</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          onClick={onBack}
          disabled={loading}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95 disabled:opacity-60"
        >
          {loading ? 'Processing...' : 'Confirm Booking'}
        </Button>
      </div>
    </form>
  );
}
