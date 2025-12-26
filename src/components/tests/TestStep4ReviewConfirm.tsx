/**
 * Test Booking Stepper - Step 4: Review & Confirm with OTP + Password
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { TestBookingBasicInfo, TestBookingLocation, TestBookingOtp, testBookingOtpSchema } from '@/lib/validation';

interface TestStep4Props {
  userInfo: TestBookingBasicInfo;
  location: TestBookingLocation;
  testType: string;
  onConfirm: (data: TestBookingOtp) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function TestStep4ReviewConfirm({
  userInfo,
  location,
  testType,
  onConfirm,
  onBack,
  loading,
  error,
}: TestStep4Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestBookingOtp>({
    resolver: zodResolver(testBookingOtpSchema),
  });

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
          <span className="text-white/70">Address:</span>
          <span className="text-white">{location.address}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">City:</span>
          <span className="text-white">
            {location.city}, {location.state} {location.zipCode}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Coordinates:</span>
          <span className="text-white text-xs font-mono">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Test Details */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
        <h3 className="font-semibold text-white mb-3">Test Details</h3>
        <div className="flex justify-between">
          <span className="text-white/70">Test Type:</span>
          <span className="text-white">{testType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Fee:</span>
          <span className="text-white font-semibold">$50.00</span>
        </div>
      </div>

      {/* Admin Scheduling Notice */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 text-sm text-blue-200">
        <p className="mb-2">
          <strong>Next Step:</strong> Your test booking is being processed. An admin will review your details and schedule
          the test date. You'll receive a confirmation email with the scheduled date and time.
        </p>
        <p>
          By confirming, you agree to pay $50 for this test booking. This amount will be deducted from your
          wallet balance. You can cancel this booking at any time to receive a refund.
        </p>
      </div>

      {/* OTP + Password Fields */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-semibold text-white mb-3">Security Verification</h3>

        <div className="space-y-2">
          <Label htmlFor="otp" className="text-white">OTP (6 digits)</Label>
          <Input
            id="otp"
            {...register('otp')}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="bg-black/50 border-white/20 text-white placeholder:text-white/40"
          />
          {errors.otp && (
            <p className="text-xs text-red-400">{errors.otp.message}</p>
          )}
        </div>

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
        </div>
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
