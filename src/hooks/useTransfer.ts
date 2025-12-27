/**
 * Wallet Transfer Hook
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { TransferDetails, TransferExecute } from '@/lib/validation';

export interface TransferState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  message: string | null;
  transactionId: string | null;
  remainingAttempts?: number;
  otpValidUntil?: Date;
}

export function useTransfer() {
  const [state, setState] = useState<TransferState>({
    status: 'idle',
    error: null,
    message: null,
    transactionId: null,
  });

  /**
   * Request OTP for transfer
   */
  const requestOtp = useCallback(
    async () => {
      setState({ status: 'loading', error: null, message: null, transactionId: null });

      try {
        const res = await api.post('/wallet/transfer/send-otp');

        setState({
          status: 'success',
          error: null,
          message: res.message || 'OTP sent successfully',
          transactionId: null,
          otpValidUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });

        return res;
      } catch (err: any) {
        const errorMessage =
          err.data?.message || err.message || 'Failed to request OTP';
        setState({
          status: 'error',
          error: errorMessage,
          message: null,
          transactionId: null,
          remainingAttempts: err.data?.remainingAttempts,
        });
        throw err;
      }
    },
    []
  );

  /**
   * Execute transfer with OTP or password
   */
  const executeTransfer = useCallback(
    async (
      details: TransferDetails,
      otpPassword: TransferExecute
    ) => {
      setState({ status: 'loading', error: null, message: null, transactionId: null });

      try {
        const payload: Record<string, unknown> = {
          recipientId: details.recipientId,
          amount: details.amount,
          transferType: details.transferType,
        };
        if (otpPassword.otp) {
          payload.otp = otpPassword.otp;
        } else if (otpPassword.password) {
          payload.password = otpPassword.password;
        }
        const res = await api.post('/wallet/transfer/execute', payload);

        setState({
          status: 'success',
          error: null,
          message: res.message || 'Transfer successful',
          transactionId: res.transactionId,
        });

        return res;
      } catch (err: any) {
        const errorMessage =
          err.data?.message || err.message || 'Failed to execute transfer';
        setState({
          status: 'error',
          error: errorMessage,
          message: null,
          transactionId: null,
          remainingAttempts: err.data?.remainingAttempts,
        });
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      error: null,
      message: null,
      transactionId: null,
    });
  }, []);

  return {
    ...state,
    requestOtp,
    executeTransfer,
    reset,
  };
}
