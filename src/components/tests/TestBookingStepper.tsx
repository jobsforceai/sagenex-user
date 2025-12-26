/**
 * Test Booking Stepper Container
 */

'use client';

import { useState, useCallback } from 'react';
import { Stepper, StepContent } from '@/components/common/Stepper';
import { TestStep1BasicInfo } from './TestStep1BasicInfo';
import { TestStep2Location } from './TestStep2Location';
import { TestStep3RequestOtp } from './TestStep3RequestOtp';
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

const STEPS = ['Personal Info', 'Location', 'Request OTP', 'Verify & Confirm', 'Confirmation'];

interface TestBookingStepperProps {
  testType?: string;
}

export function TestBookingStepper({ testType = 'Medical Test' }: TestBookingStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState<TestBookingBasicInfo | null>(null);
  const [location, setLocation] = useState<TestBookingLocation | null>(null);

  const { status, error, bookingId, transactionId, otpValidUntil, message, idempotencyKey, requestOtp, scheduleTest, reset } = useTestBooking();

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

  // Step 3: Request OTP
  const handleRequestOtp = useCallback(async () => {
    if (!userInfo || !location) return;

    try {
      await requestOtp({
        testType,
        testLocation: location,
        userInfo,
      });
      setCurrentStep(3);
      toast.success('OTP sent successfully!');
    } catch (err: any) {
      const errorMsg = err.data?.message || err.message || 'Failed to send OTP';
      console.error('OTP request failed:', errorMsg);
      toast.error(errorMsg);
    }
  }, [userInfo, location, testType, requestOtp]);

  // Step 4: Review & Confirm with OTP + Password
  const handleConfirmBooking = useCallback(async (otpData: TestBookingOtp) => {
    if (!userInfo || !location) return;

    const bookingData: TestBooking = {
      testType,
      testLocation: location,
      userInfo,
      otp: otpData.otp,
      password: otpData.password,
      idempotencyKey,
    };

    try {
      const result = await scheduleTest(bookingData);
      setCurrentStep(4);
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
  }, [userInfo, location, testType, idempotencyKey, scheduleTest]);

  // Step 5: Finish
  const handleFinish = useCallback(() => {
    reset();
    setCurrentStep(0);
    setUserInfo(null);
    setLocation(null);
  }, [reset]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={currentStep > 4 ? [0, 1, 2, 3, 4] : []}
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
          <TestStep3RequestOtp
            onRequest={handleRequestOtp}
            onBack={() => setCurrentStep(1)}
            otpValidUntil={otpValidUntil}
            message={message}
            error={error}
            loading={status === 'loading'}
          />
        </StepContent>

        <StepContent isActive={currentStep === 3}>
          {userInfo && location && (
            <TestStep4ReviewConfirm
              userInfo={userInfo}
              location={location}
              testType={testType}
              onConfirm={handleConfirmBooking}
              onBack={() => setCurrentStep(2)}
              loading={status === 'loading'}
              error={error}
            />
          )}
        </StepContent>

        <StepContent isActive={currentStep === 4}>
          {bookingId && transactionId && (
            <TestStep5Confirmation
              bookingId={bookingId}
              transactionId={transactionId}
              onFinish={handleFinish}
            />
          )}
        </StepContent>
      </div>
    </div>
  );
}
