/**
 * Transfer Stepper Container
 */

'use client';

import { useState, useCallback } from 'react';
import { Stepper, StepContent } from '@/components/common/Stepper';
import { Step1TransferDetails } from './Step1TransferDetails';
import { Step2RequestOtp } from './Step2RequestOtp';
import { Step3ExecuteTransfer } from './Step3ExecuteTransfer';
import { Step4Confirmation } from './Step4Confirmation';
import { useTransfer } from '@/hooks/useTransfer';
import { TransferDetails, TransferExecute } from '@/lib/validation';
import { toast } from 'sonner';

const STEPS = ['Details', 'Request OTP', 'Verify & Execute', 'Confirmation'];

export function TransferStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [transferData, setTransferData] = useState<TransferDetails | null>(null);
  const {
    status,
    error,
    message,
    transactionId,
    otpValidUntil,
    requestOtp,
    executeTransfer,
    reset,
  } = useTransfer();

  // Step 1: Collect transfer details
  const handleDetailsSubmit = useCallback((data: TransferDetails) => {
    setTransferData(data);
    setCurrentStep(1);
  }, []);

  // Step 2: Request OTP
  const handleRequestOtp = useCallback(async () => {
    try {
      await requestOtp();
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to request OTP');
    }
  }, [requestOtp]);

  // Step 3: Execute transfer
  const handleExecuteTransfer = useCallback(
    async (otpPassword: TransferExecute) => {
      if (!transferData) return;

      try {
        await executeTransfer(transferData, otpPassword);
        setCurrentStep(3);
        toast.success('Transfer completed successfully!');
      } catch (err: any) {
        toast.error(err.data?.message || 'Failed to execute transfer');
      }
    },
    [transferData, executeTransfer]
  );

  // Step 4: Finish
  const handleFinish = useCallback(() => {
    reset();
    setCurrentStep(0);
    setTransferData(null);
    // Optionally redirect or refresh wallet
  }, [reset]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        completedSteps={currentStep > 3 ? [0, 1, 2, 3] : []}
      />

      <div className="mt-12 p-6 rounded-lg bg-white/5 border border-white/10">
        <StepContent isActive={currentStep === 0}>
          <Step1TransferDetails
            onNext={handleDetailsSubmit}
            initialData={transferData || undefined}
          />
        </StepContent>

        <StepContent isActive={currentStep === 1}>
          <Step2RequestOtp
            onRequest={handleRequestOtp}
            onBack={() => setCurrentStep(0)}
            onSkip={() => setCurrentStep(2)}
            loading={status === 'loading'}
            error={error}
            message={message}
            otpValidUntil={otpValidUntil}
          />
        </StepContent>

        <StepContent isActive={currentStep === 2}>
          {transferData && (
            <Step3ExecuteTransfer
              onExecute={handleExecuteTransfer}
              onBack={() => setCurrentStep(1)}
              loading={status === 'loading'}
              error={error}
              amount={transferData.amount}
              recipientId={transferData.recipientId}
            />
          )}
        </StepContent>

        <StepContent isActive={currentStep === 3}>
          {transferData && transactionId && (
            <Step4Confirmation
              amount={transferData.amount}
              recipientId={transferData.recipientId}
              transactionId={transactionId}
              onFinish={handleFinish}
            />
          )}
        </StepContent>
      </div>
    </div>
  );
}
