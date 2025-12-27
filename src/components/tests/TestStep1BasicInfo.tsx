/**
 * Test Booking Stepper - Step 1: Basic Info
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TestBookingBasicInfo, testBookingBasicInfoSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface TestStep1Props {
  onNext: (data: TestBookingBasicInfo) => void;
  initialData?: TestBookingBasicInfo;
}

export function TestStep1BasicInfo({ onNext, initialData }: TestStep1Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestBookingBasicInfo>({
    resolver: zodResolver(testBookingBasicInfoSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* First Name */}
        <div>
          <Label htmlFor="firstName" className="text-white/90">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            {...register('firstName')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.firstName && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.firstName.message}
            </div>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName" className="text-white/90">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            {...register('lastName')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.lastName && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.lastName.message}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-white/90">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.email && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.email.message}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-white/90">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            {...register('phone')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.phone && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.phone.message}
            </div>
          )}
        </div>

        {/* Age */}
        <div>
          <Label htmlFor="age" className="text-white/90">
            Age <span className="text-xs text-white/50">(Optional)</span>
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="30"
            {...register('age', { valueAsNumber: true })}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.age && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.age.message}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
        >
          Next: Location
        </Button>
      </div>
    </form>
  );
}
