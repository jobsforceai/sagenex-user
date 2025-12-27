'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TestBookingStepper } from '@/components/tests/TestBookingStepper';
import { ExistingBookingStatus } from '@/components/tests/ExistingBookingStatus';
import { useTestBooking } from '@/hooks/useTestBooking';
import Navbar from '@/app/components/Navbar';

export default function BookTestPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { fetchBookings, bookings } = useTestBooking();
  const [bookingsLoaded, setBookingsLoaded] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);

  // Check for existing active bookings
  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchBookings()
        .then(() => {
          setBookingsLoaded(true);
        })
        .catch(() => {
          setBookingsLoaded(true);
        });
    }
  }, [isAuthenticated, loading, fetchBookings]);

  // Find active booking (PENDING/RECEIVED/ATTENDED/CONFIRMED)
  useEffect(() => {
    if (bookingsLoaded && bookings.length > 0) {
      const active = bookings.find(
        (b) =>
          b.status === 'PENDING' ||
          b.status === 'RECEIVED' ||
          b.status === 'ATTENDED' ||
          b.status === 'CONFIRMED'
      );
      setActiveBooking(active || null);
    }
  }, [bookings, bookingsLoaded]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?next=/tests/book');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !bookingsLoaded) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleNewBooking = () => {
    setActiveBooking(null);
    window.location.reload();
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-linear-to-b from-black via-[#0b1310] to-[#0f1d17] text-white pt-32 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Show existing booking if active */}
            {activeBooking ? (
              <>
                <div className="mb-10 space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    Active Booking
                  </span>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                    Your Test Booking
                  </h1>
                  <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed">
                    You already have an active test booking. Review the details and keep an eye on updates.
                  </p>
                </div>
                <ExistingBookingStatus booking={activeBooking} onNewBooking={handleNewBooking} />
              </>
            ) : (
              <>
                <div className="mb-10 space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                    New Booking
                  </span>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                    Book a Test
                  </h1>
                  <p className="text-white/70 text-base md:text-lg max-w-xl leading-relaxed">
                    Schedule your medical test with ease. Complete this form to book your appointment.
                  </p>
                </div>
                <TestBookingStepper />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
