/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Wallet Transfer Validation Schemas
 */
export const transferDetailsSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  transferType: z.enum(['TO_AVAILABLE_BALANCE', 'TO_PACKAGE']),
});

export const transferOtpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6).regex(/^\d+$/, 'OTP must contain only digits'),
});

export const transferExecuteSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6).regex(/^\d+$/, 'OTP must contain only digits'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Test Booking Validation Schemas
 */
export const testBookingBasicInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^[\d\-\+\s\(\)]+$/, 'Invalid phone format'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive('Age must be a positive number').optional(),
});

export const testBookingLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().regex(/^[\d\-]+$/, 'Invalid zip code format'),
});

export const testBookingOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  password: z.string().min(1, 'Password is required'),
});

export const testBookingSchema = z.object({
  testType: z.string().min(1, 'Test type is required'),
  testLocation: testBookingLocationSchema,
  userInfo: testBookingBasicInfoSchema,
  otp: z.string().length(6),
  password: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

/**
 * Type exports for form usage
 */
export type TransferDetails = z.infer<typeof transferDetailsSchema>;
export type TransferOtp = z.infer<typeof transferOtpSchema>;
export type TransferExecute = z.infer<typeof transferExecuteSchema>;
export type TestBookingBasicInfo = z.infer<typeof testBookingBasicInfoSchema>;
export type TestBookingLocation = z.infer<typeof testBookingLocationSchema>;
export type TestBookingOtp = z.infer<typeof testBookingOtpSchema>;
export type TestBooking = z.infer<typeof testBookingSchema>;
