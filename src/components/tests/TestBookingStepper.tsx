/**
 * Test Booking Stepper Container
 */

'use client';

import { useState, useCallback } from 'react';
import { Stepper, StepContent } from '@/components/common/Stepper';
import { TestStep1BasicInfo } from './TestStep1BasicInfo';
import { TestStep2Location } from './TestStep2Location';
import { TestStep4ReviewConfirm } from './TestStep4ReviewConfirm';
import { TestStep5Confirmation } from './TestStep5Confirmation';
import { useTestBooking } from '@/hooks/useTestBooking';
import {
  TestBookingBasicInfo,
  TestBookingLocation,
  TestBookingOtp,
  TestBooking,
} from '@/lib/validation';
import { toast } from 'sonner';

const STEPS = ['Personal Info', 'Test & Location', 'Verify & Confirm', 'Confirmation'];

export function TestBookingStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<TestBookingBasicInfo | null>(null);
  const [location, setLocation] = useState<TestBookingLocation | null>(null);

  const { status, error, bookingId, booking, otpValidUntil, message, idempotencyKey, requestOtp, scheduleTest, reset } = useTestBooking();

  // Step 1: Basic Info
  const handleBasicInfoSubmit = useCallback((data: TestBookingBasicInfo) => {
    setUserInfo(data);
    setCurrentStep(1);
  }, []);

  // Step 2: Location
  const handleLocationSubmit = useCallback((data: TestBookingLocation) => {
    setLocation(data);
    setCurrentStep(2);
  }, []);

  // Request OTP (optional)
  const handleRequestOtp = useCallback(async (): Promise<boolean> => {
    if (!userInfo || !location) return false;

    try {
      await requestOtp({
        testId: location.testId,
        locationId: location.locationId,
        userInfo,
      });
      toast.success('OTP sent successfully!');
      return true;
    } catch (err: any) {
      const errorMsg = err.data?.message || err.message || 'Failed to send OTP';
      console.error('OTP request failed:', errorMsg);
      toast.error(errorMsg);
      return false;
    }
  }, [userInfo, location, requestOtp]);

  // Step 3: Review & Confirm with OTP or password
  const handleConfirmBooking = useCallback(async (otpData: TestBookingOtp) => {
    if (!userInfo || !location) return;

    const bookingData: TestBooking = {
      testId: location.testId,
      locationId: location.locationId,
      userInfo,
      idempotencyKey,
    };
    if (otpData.otp) {
      bookingData.otp = otpData.otp;
    } else if (otpData.password) {
      bookingData.password = otpData.password;
    }

    try {
      const result = await scheduleTest(bookingData);
      setCurrentStep(3);
      toast.success('Test booked successfully!');
    } catch (err: any) {
      // Error is already set in state by scheduleTest hook
      // Just show toast as fallback
      const errorMsg = err.data?.message || err.message || 'Failed to book test';
      console.error('Test booking failed:', errorMsg);
      console.error('Full error:', err);
      toast.error(errorMsg);
      // Don't advance step - stay on review to show error
    }
  }, [userInfo, location, idempotencyKey, scheduleTest]);

  // Step 4: Finish
  const handleFinish = useCallback(() => {
    reset();
    setCurrentStep(0);
    setUserInfo(null);
    setLocation(null);
  }, [reset]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={currentStep > 3 ? [0, 1, 2, 3] : []}
      />

      <div className="mt-12 p-6 rounded-lg bg-white/5 border border-white/10">
        <StepContent isActive={currentStep === 0}>
          <TestStep1BasicInfo
            onNext={handleBasicInfoSubmit}
            initialData={userInfo || undefined}
          />
        </StepContent>

        <StepContent isActive={currentStep === 1}>
          <TestStep2Location
            onNext={handleLocationSubmit}
            onBack={() => setCurrentStep(0)}
            initialData={location || undefined}
          />
        </StepContent>

        <StepContent isActive={currentStep === 2}>
          {userInfo && location && (
            <TestStep4ReviewConfirm
              userInfo={userInfo}
              test={location.test}
              locationDetails={location.location}
              onRequestOtp={handleRequestOtp}
              otpValidUntil={otpValidUntil}
              otpMessage={message}
              onConfirm={handleConfirmBooking}
              onBack={() => setCurrentStep(1)}
              loading={status === 'loading'}
              error={error}
            />
          )}
        </StepContent>

        <StepContent isActive={currentStep === 3}>
          {bookingId && (
            <TestStep5Confirmation
              booking={booking}
              fallbackTest={location?.test}
              onFinish={handleFinish}
            />
          )}
        </StepContent>
      </div>
    </div>
  );
}
