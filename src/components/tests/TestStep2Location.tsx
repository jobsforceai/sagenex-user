/**
 * Test Booking Stepper - Step 2: Location
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TestBookingLocation, testBookingLocationSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { AlertCircle, MapPin } from 'lucide-react';
import { getTestsCatalog } from '@/actions/user';
import type { TestCatalogItem, TestCatalogLocation } from '@/types/tests';

interface TestStep2Props {
  onNext: (data: TestBookingLocation) => void;
  onBack: () => void;
  initialData?: TestBookingLocation;
}

export function TestStep2Location({ onNext, onBack, initialData }: TestStep2Props) {
  const [tests, setTests] = useState<TestCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<TestCatalogItem | null>(initialData?.test || null);
  const [selectedLocation, setSelectedLocation] = useState<TestCatalogLocation | null>(initialData?.location || null);
  const catalogEndpoint = useMemo(() => {
    const rawBase =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:8080';
    const base = rawBase.replace(/\/$/, '');
    if (base.endsWith('/api/v1')) {
      return `${base}/tests/catalog`;
    }
    return `${base}/api/v1/tests/catalog`;
  }, []);

  const {
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    setError,
  } = useForm<TestBookingLocation>({
    resolver: zodResolver(testBookingLocationSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        console.log('[tests] fetching catalog from:', catalogEndpoint);
        const res = await getTestsCatalog();
        console.log('[tests] catalog response:', res);
        if (res.error) {
          setCatalogError(res.error);
        } else {
          const catalogTests: TestCatalogItem[] = Array.isArray(res.tests) ? res.tests : [];
          setTests(catalogTests);
          console.log('[tests] catalog tests count:', catalogTests.length);
          console.log(
            '[tests] catalog tests data:',
            catalogTests.map((test: TestCatalogItem) => ({
              testId: test.testId,
              heading: test.heading,
              locationCount: test.locations?.length || 0,
              allowAllLocations: test.allowAllLocations,
              allowedLocationIds: test.allowedLocationIds,
            }))
          );
        }
      } catch (err: any) {
        setCatalogError(err?.message || 'Failed to load available tests.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  useEffect(() => {
    if (tests.length === 0) return;
    if (!selectedTest && initialData?.testId) {
      const foundTest = tests.find((test) => test.testId === initialData.testId) || null;
      if (foundTest) {
        setSelectedTest(foundTest);
      }
    }
  }, [tests, selectedTest, initialData?.testId]);

  useEffect(() => {
    if (!selectedTest || !initialData?.locationId) return;
    if (!selectedLocation) {
      const foundLocation = selectedTest.locations.find(
        (location) => location.locationId === initialData.locationId
      );
      if (foundLocation) {
        setSelectedLocation(foundLocation);
      }
    }
  }, [selectedTest, selectedLocation, initialData?.locationId]);

  const availableLocations = useMemo(() => {
    if (!selectedTest) return [];
    if (selectedTest.allowAllLocations || selectedTest.allowedLocationIds.length === 0) {
      return selectedTest.locations;
    }
    return selectedTest.locations.filter((location) =>
      selectedTest.allowedLocationIds.includes(location.locationId)
    );
  }, [selectedTest]);

  const handleSelectTest = (test: TestCatalogItem) => {
    setSelectedTest(test);
    setSelectedLocation(null);
    setValue('testId', test.testId, { shouldValidate: true });
    setValue('locationId', '', { shouldValidate: true });
    console.log('[tests] selected test:', test.testId, test.heading, test);
    console.log('[tests] selected test locations:', test.locations);
  };

  const handleSelectLocation = (location: TestCatalogLocation) => {
    setSelectedLocation(location);
    setValue('locationId', location.locationId, { shouldValidate: true });
    console.log('[tests] selected location:', location.locationId, location.name, location);
  };

  const handleNext = (data: TestBookingLocation) => {
    if (!selectedTest) {
      setError('testId', { message: 'Please select a test.' });
      return;
    }
    if (!selectedLocation) {
      setError('locationId', { message: 'Please select a location.' });
      return;
    }

    onNext({
      ...data,
      test: selectedTest,
      location: selectedLocation,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
      <input type="hidden" {...register('testId')} />
      <input type="hidden" {...register('locationId')} />

      {loading && <p className="text-sm text-white/70">Loading available tests...</p>}
      {catalogError && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {catalogError}
        </div>
      )}

      {!loading && tests.length === 0 && !catalogError && (
        <p className="text-sm text-white/70">No available tests at the moment.</p>
      )}

      {tests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/80">Choose a test</h3>
          <div className="grid gap-4">
            {tests.map((test) => {
              const isActive = selectedTest?.testId === test.testId;
              return (
                <button
                  type="button"
                  key={test.testId}
                  onClick={() => handleSelectTest(test)}
                  className={`rounded-lg border p-4 text-left transition ${
                    isActive
                      ? 'border-emerald-400/70 bg-emerald-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{test.heading}</p>
                      <p className="text-sm text-white/60">{test.subheading}</p>
                      <p className="text-xs text-white/50 mt-2">{test.description}</p>
                    </div>
                    <div className="text-sm text-white/80 sm:text-right">
                      <p className="font-semibold">₹{test.priceUSD.toFixed(2)}</p>
                      <p className="text-xs text-white/50">{test.durationMinutes} min</p>
                      <p className="text-xs text-white/50 mt-2">
                        {new Date(test.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.testId && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.testId.message}
            </div>
          )}
        </div>
      )}

      {selectedTest && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white/80">Choose a location</h3>
          {availableLocations.length === 0 ? (
            <p className="text-sm text-white/70">No available locations for this test.</p>
          ) : (
            <div className="grid gap-3">
              {availableLocations.map((location) => {
                const isActive = selectedLocation?.locationId === location.locationId;
                return (
                  <button
                    type="button"
                    key={location.locationId}
                    onClick={() => handleSelectLocation(location)}
                    className={`rounded-lg border p-4 text-left transition ${
                      isActive
                        ? 'border-emerald-400/70 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-emerald-300 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">{location.name}</p>
                        <p className="text-xs text-white/60">{location.address}</p>
                        <p className="text-xs text-white/60">
                          {location.city}, {location.state} {location.zipCode}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {errors.locationId && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {errors.locationId.message}
            </div>
          )}
        </div>
      )}

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
          Next: Verify & Confirm
        </Button>
      </div>
    </form>
  );
}
