/**
 * Wallet Transfer Stepper - Step 1: Transfer Details
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransferDetails, transferDetailsSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface Step1Props {
  onNext: (data: TransferDetails) => void;
  initialData?: TransferDetails;
}

export function Step1TransferDetails({ onNext, initialData }: Step1Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TransferDetails>({
    resolver: zodResolver(transferDetailsSchema),
    defaultValues: initialData || {
      recipientId: 'U001',
      amount: 50,
      transferType: 'TO_AVAILABLE_BALANCE',
    },
  });

  const amount = watch('amount');
  const isFixedAmount = amount === 50; // For U001 with fixed ₹50 transfer

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Recipient ID */}
        <div>
          <Label htmlFor="recipientId" className="text-white/90">
            Recipient ID
          </Label>
          <Input
            id="recipientId"
            type="text"
            placeholder="e.g., U001"
            {...register('recipientId')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.recipientId && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.recipientId.message}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="amount" className="text-white/90">
            Amount (INR) {isFixedAmount && <span className="text-xs text-emerald-300">(Fixed)</span>}
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="50"
            {...register('amount', { valueAsNumber: true })}
            disabled={isFixedAmount}
            className="mt-2 bg-white/5 border-white/20 text-white disabled:opacity-60"
          />
          {errors.amount && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.amount.message}
            </div>
          )}
        </div>

        {/* Transfer Type */}
        <div>
          <Label htmlFor="transferType" className="text-white/90">
            Transfer Type
          </Label>
          <select
            id="transferType"
            {...register('transferType')}
            className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="TO_AVAILABLE_BALANCE">To Available Balance</option>
            <option value="TO_PACKAGE">To Package</option>
          </select>
          {errors.transferType && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.transferType.message}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-200">
        <p>
          You're about to transfer <strong>₹{amount}</strong> to <strong>{watch('recipientId')}</strong>.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
        >
          Next: Request OTP
        </Button>
      </div>
    </form>
  );
}
