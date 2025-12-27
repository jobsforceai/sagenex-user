/**
 * Validation schemas using Zod
 */

import { z } from 'zod';
import type { TestCatalogItem, TestCatalogLocation } from '@/types/tests';

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

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const optionalOtp = z
  .string()
  .transform(normalizeOptional)
  .refine((value) => !value || /^\d{6}$/.test(value), {
    message: 'OTP must be 6 digits',
  })
  .optional();

const optionalPassword = z.string().transform(normalizeOptional).optional();

export const transferExecuteSchema = z
  .object({
    otp: optionalOtp,
    password: optionalPassword,
  })
  .superRefine((data, ctx) => {
    if (!data.otp && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter OTP or password to continue.',
        path: ['otp'],
      });
    }
    if (data.otp && data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use OTP or password, not both.',
        path: ['password'],
      });
    }
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
  testId: z.string().min(1, 'Test selection is required'),
  locationId: z.string().min(1, 'Location selection is required'),
});

const optionalTestOtp = z
  .string()
  .transform(normalizeOptional)
  .refine((value) => !value || /^\d{6}$/.test(value), {
    message: 'OTP must be 6 digits',
  })
  .optional();

const optionalTestPassword = z.string().transform(normalizeOptional).optional();

export const testBookingOtpSchema = z
  .object({
    otp: optionalTestOtp,
    password: optionalTestPassword,
  })
  .superRefine((data, ctx) => {
    if (!data.otp && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter OTP or password to continue.',
        path: ['otp'],
      });
    }
    if (data.otp && data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use OTP or password, not both.',
        path: ['password'],
      });
    }
  });

export const testBookingSchema = z.object({
  testId: z.string().min(1, 'Test selection is required'),
  locationId: z.string().min(1, 'Location selection is required'),
  userInfo: testBookingBasicInfoSchema,
  otp: optionalTestOtp,
  password: optionalTestPassword,
  idempotencyKey: z.string().min(1),
}).superRefine((data, ctx) => {
  if (!data.otp && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter OTP or password to continue.',
      path: ['otp'],
    });
  }
  if (data.otp && data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use OTP or password, not both.',
      path: ['password'],
    });
  }
});

/**
 * Type exports for form usage
 */
export type TransferDetails = z.infer<typeof transferDetailsSchema>;
export type TransferOtp = z.infer<typeof transferOtpSchema>;
export type TransferExecute = z.infer<typeof transferExecuteSchema>;
export type TestBookingBasicInfo = z.infer<typeof testBookingBasicInfoSchema>;
export type TestBookingLocation = z.infer<typeof testBookingLocationSchema> & {
  test?: TestCatalogItem;
  location?: TestCatalogLocation;
};
export type TestBookingOtp = z.infer<typeof testBookingOtpSchema>;
export type TestBooking = z.infer<typeof testBookingSchema>;
