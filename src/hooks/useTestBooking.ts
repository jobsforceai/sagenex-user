/**
 * Test Booking Hook
 */

'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { TestBooking } from '@/lib/validation';

export interface Booking {
  bookingId: string;
  testType: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  testDate?: string;
  testLocation: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  userInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    age?: number;
  };
  paymentTransactionId: string;
  transactionDetails?: {
    debitedFrom: string;
    creditedTo: string;
    amount: number;
    timestamp: string;
  };
}

export interface BookingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  message: string | null;
  bookingId: string | null;
  transactionId: string | null;
  otpValidUntil: Date | null;
  remainingAttempts: number;
  idempotencyKey: string;
}

export function useTestBooking() {
  const [state, setState] = useState<BookingState>({
    status: 'idle',
    error: null,
    message: null,
    bookingId: null,
    transactionId: null,
    otpValidUntil: null,
    remainingAttempts: 3,
    idempotencyKey: `book_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  /**
   * Request OTP for test booking
   */
  const requestOtp = useCallback(async (bookingDetails: {
    testType: string;
    testLocation: any;
    userInfo: any;
  }) => {
    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const res = await api.post('/tests/send-otp', {
        ...bookingDetails,
        amount: 50, // Fixed amount
      });

      setState(prev => ({
        ...prev,
        status: 'success',
        message: res.message || 'OTP sent successfully',
        otpValidUntil: res.otpValidUntil ? new Date(res.otpValidUntil) : null,
        remainingAttempts: res.remainingAttempts || 3,
        error: null,
      }));

      return res;
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to send OTP';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        message: null,
      }));
      throw err;
    }
  }, []);

  /**
   * Schedule a new test booking with OTP + password
   */
  const scheduleTest = useCallback(async (bookingData: TestBooking) => {
    setState(prev => ({ ...prev, status: 'loading', error: null, message: null }));

    try {
      const res = await api.post('/tests/schedule', bookingData);

      setState(prev => ({
        ...prev,
        status: 'success',
        error: null,
        message: res.message || 'Test scheduled successfully',
        bookingId: res.bookingId,
        transactionId: res.transactionId,
      }));

      return res;
    } catch (err: any) {
      const errorMessage =
        err.data?.message || err.message || 'Failed to schedule test';
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        message: null,
      }));
      throw err;
    }
  }, []);

  /**
   * Fetch all bookings for the user
   */
  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/tests');
      setBookings(res.bookings || []);
      return res;
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      throw err;
    }
  }, []);

  /**
   * Fetch a specific booking by ID
   */
  const fetchBooking = useCallback(async (bookingId: string) => {
    try {
      const res = await api.get(`/tests/${bookingId}`);
      setCurrentBooking(res.booking);
      return res.booking;
    } catch (err: any) {
      console.error('Failed to fetch booking:', err);
      throw err;
    }
  }, []);

  /**
   * Cancel a booking
   */
  const cancelBooking = useCallback(
    async (bookingId: string, reason?: string) => {
      try {
        const res = await api.post(`/tests/${bookingId}/cancel`, { reason });

        // Update bookings list
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === bookingId ? { ...b, status: 'CANCELLED' } : b
          )
        );

        setState({
          status: 'success',
          error: null,
          message: res.message || 'Booking cancelled successfully',
          bookingId,
          transactionId: null,
          otpValidUntil: null,
          remainingAttempts: 3,
          idempotencyKey: `book_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });

        return res;
      } catch (err: any) {
        const errorMessage =
          err.data?.message || err.message || 'Failed to cancel booking';
        setState({
          status: 'error',
          error: errorMessage,
          message: null,
          bookingId: null,
          transactionId: null,
          otpValidUntil: null,
          remainingAttempts: 3,
          idempotencyKey: `book_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
      bookingId: null,
      transactionId: null,
      otpValidUntil: null,
      remainingAttempts: 3,
      idempotencyKey: `book_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
  }, []);

  return {
    ...state,
    bookings,
    currentBooking,
    requestOtp,
    scheduleTest,
    fetchBookings,
    fetchBooking,
    cancelBooking,
    reset,
  };
}
