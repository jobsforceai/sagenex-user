/**
 * Wallet Transfer Stepper - Step 3: Execute Transfer
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransferExecute, transferExecuteSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface Step3Props {
  onExecute: (data: TransferExecute) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  amount: number;
  recipientId: string;
}

export function Step3ExecuteTransfer({
  onExecute,
  onBack,
  loading,
  error,
  amount,
  recipientId,
}: Step3Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferExecute>({
    resolver: zodResolver(transferExecuteSchema),
  });

  return (
    <form onSubmit={handleSubmit(onExecute)} className="space-y-6">
      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-400/30 text-sm text-red-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-white/70">Recipient:</span>
          <span className="text-white font-medium">{recipientId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">Amount:</span>
          <span className="text-white font-medium">₹{amount}</span>
        </div>
        <p className="text-xs text-white/50 mt-2">Use OTP or password to authorize (one only).</p>
      </div>

      <div className="space-y-4">
        {/* OTP */}
        <div>
          <Label htmlFor="otp" className="text-white/90">
            OTP (6 digits, optional)
          </Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            {...register('otp')}
            className="mt-2 bg-white/5 border-white/20 text-white font-mono text-center tracking-widest"
          />
          {errors.otp && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.otp.message}
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password" className="text-white/90">
            Password (optional)
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.password && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.password.message}
            </div>
          )}
          <p className="text-xs text-white/50 mt-1">Your password will not be stored.</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-3">
        <Button
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
          {loading ? 'Processing...' : 'Execute Transfer'}
        </Button>
      </div>
    </form>
  );
}
