/**
 * Test Booking Stepper - Step 2: Location
 */

'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TestBookingLocation, testBookingLocationSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, MapPin } from 'lucide-react';

interface TestStep2Props {
  onNext: (data: TestBookingLocation) => void;
  onBack: () => void;
  initialData?: TestBookingLocation;
}

export function TestStep2Location({ onNext, onBack, initialData }: TestStep2Props) {
  const [geoLoading, setGeoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestBookingLocation>({
    resolver: zodResolver(testBookingLocationSchema),
    defaultValues: initialData,
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');

  // Geolocation handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', position.coords.latitude);
        setValue('longitude', position.coords.longitude);
        setGeoLoading(false);
      },
      (error) => {
        alert(`Geolocation error: ${error.message}`);
        setGeoLoading(false);
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        {/* Latitude */}
        <div>
          <Label htmlFor="latitude" className="text-white/90">
            Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            placeholder="40.7128"
            {...register('latitude', { valueAsNumber: true })}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.latitude && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.latitude.message}
            </div>
          )}
        </div>

        {/* Longitude */}
        <div>
          <Label htmlFor="longitude" className="text-white/90">
            Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            placeholder="-74.0060"
            {...register('longitude', { valueAsNumber: true })}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.longitude && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.longitude.message}
            </div>
          )}
        </div>

        {/* Geolocation Button */}
        {latitude && longitude && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-sm text-emerald-200 flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Current location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleGetLocation}
          disabled={geoLoading}
          variant="outline"
          className="w-full border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/10"
        >
          {geoLoading ? 'Getting location...' : 'Use Current Location'}
        </Button>

        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-white/90">
            Address
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="123 Main Street"
            {...register('address')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.address && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.address.message}
            </div>
          )}
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city" className="text-white/90">
            City
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="New York"
            {...register('city')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.city && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.city.message}
            </div>
          )}
        </div>

        {/* State */}
        <div>
          <Label htmlFor="state" className="text-white/90">
            State
          </Label>
          <Input
            id="state"
            type="text"
            placeholder="NY"
            {...register('state')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.state && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.state.message}
            </div>
          )}
        </div>

        {/* Zip Code */}
        <div>
          <Label htmlFor="zipCode" className="text-white/90">
            Zip Code
          </Label>
          <Input
            id="zipCode"
            type="text"
            placeholder="10001"
            {...register('zipCode')}
            className="mt-2 bg-white/5 border-white/20 text-white"
          />
          {errors.zipCode && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.zipCode.message}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/5"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
        >
          Next: Schedule
        </Button>
      </div>
    </form>
  );
}
