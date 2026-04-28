/**
 * Existing Test Booking Status Display
 */

'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Clock, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { Booking } from '@/hooks/useTestBooking';
import QRCode from 'react-qr-code';

interface ExistingBookingStatusProps {
  booking: Booking;
  onNewBooking: () => void;
}

export function ExistingBookingStatus({ booking, onNewBooking }: ExistingBookingStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-200' };
      case 'RECEIVED':
        return { bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-200' };
      case 'ATTENDED':
        return { bg: 'bg-sky-500/10', border: 'border-sky-400/30', text: 'text-sky-200' };
      case 'RESULTS_PUBLISHED':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-200' };
      case 'CONFIRMED':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', text: 'text-emerald-200' };
      case 'COMPLETED':
        return { bg: 'bg-green-500/10', border: 'border-green-400/30', text: 'text-green-200' };
      case 'CANCELLED':
        return { bg: 'bg-red-500/10', border: 'border-red-400/30', text: 'text-red-200' };
      default:
        return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'RECEIVED':
      case 'ATTENDED':
      case 'RESULTS_PUBLISHED':
      case 'CONFIRMED':
      case 'COMPLETED':
        return <Check className="w-5 h-5" />;
      case 'CANCELLED':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const colors = getStatusColor(booking.status);
  const testName = booking.testType || booking.testId || 'Test';
  const canBookAgain = ['CANCELLED', 'COMPLETED', 'RESULTS_PUBLISHED'].includes(booking.status);
  const showHallTicket =
    booking.status === 'RECEIVED' &&
    (booking.examId || booking.hallTicketQrPayload || booking.hallTicketIssuedAt);
  const showResults = booking.status === 'RESULTS_PUBLISHED';
  const statusTitle = (() => {
    switch (booking.status) {
      case 'PENDING':
        return 'Booking Pending';
      case 'RECEIVED':
        return 'Hallticket Issued';
      case 'ATTENDED':
        return 'Test Attended';
      case 'RESULTS_PUBLISHED':
        return 'Results Published';
      case 'CONFIRMED':
        return 'Test Scheduled';
      case 'COMPLETED':
        return 'Test Completed';
      case 'CANCELLED':
        return 'Booking Cancelled';
      default:
        return 'Booking Update';
    }
  })();
  const statusDescription = (() => {
    switch (booking.status) {
      case 'PENDING':
        return 'Your test booking is being reviewed. An admin will schedule your test date soon.';
      case 'RECEIVED':
        return 'Your hallticket is ready. Use the details below for your exam entry.';
      case 'ATTENDED':
        return 'Attendance recorded. Results will be published soon.';
      case 'RESULTS_PUBLISHED':
        return 'Your results are available below.';
      case 'CONFIRMED':
        return 'Your test has been scheduled. Check your email for the confirmation details.';
      case 'COMPLETED':
        return 'Your test has been completed successfully.';
      case 'CANCELLED':
        return 'This booking has been cancelled and refunded.';
      default:
        return 'Your booking status has been updated.';
    }
  })();

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-6 rounded-lg ${colors.bg} border ${colors.border} ${colors.text}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{getStatusIcon(booking.status)}</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              {statusTitle}
            </h2>
            <p className="text-sm opacity-90">
              {statusDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-semibold text-white mb-4">Booking Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Booking ID */}
          <div>
            <p className="text-white/70 text-sm mb-1">Booking ID</p>
            <p className="text-white font-mono text-sm">{booking.bookingId}</p>
          </div>

          {/* Test Type */}
          <div>
            <p className="text-white/70 text-sm mb-1">Test</p>
            <p className="text-white">{testName}</p>
          </div>

          {/* Status */}
          <div>
            <p className="text-white/70 text-sm mb-1">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.border} border ${colors.text}`}>
              {booking.status}
            </span>
          </div>

          {/* Amount */}
          <div>
            <p className="text-white/70 text-sm mb-1">Test Fee</p>
            <p className="text-white font-semibold">
              {booking.priceUSD !== undefined ? `₹${booking.priceUSD.toFixed(2)}` : '—'}
            </p>
          </div>

          {/* Test Date (if scheduled) */}
          {booking.testDate && (
            <div>
              <p className="text-white/70 text-sm mb-1">Scheduled Test Date</p>
              <p className="text-white">
                {new Date(booking.testDate).toLocaleString()}
              </p>
            </div>
          )}

          {booking.hallTicketIssuedAt && (
            <div>
              <p className="text-white/70 text-sm mb-1">Hallticket Issued</p>
              <p className="text-white">
                {new Date(booking.hallTicketIssuedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Transaction ID */}
          {booking.paymentTransactionId && (
            <div>
              <p className="text-white/70 text-sm mb-1">Transaction ID</p>
              <p className="text-white font-mono text-sm">{booking.paymentTransactionId}</p>
            </div>
          )}
        </div>
      </div>

      {showHallTicket && (
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
          <h3 className="font-semibold text-white mb-2">Hallticket Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Exam ID</p>
              <p className="text-white font-mono text-sm">{booking.examId || '—'}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Issued At</p>
              <p className="text-white">
                {booking.hallTicketIssuedAt ? new Date(booking.hallTicketIssuedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
          {booking.hallTicketQrPayload && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-4">
              <QRCode value={booking.hallTicketQrPayload} size={160} />
              <p className="text-xs text-white/60">Scan for hallticket verification.</p>
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
          <h3 className="font-semibold text-white mb-2">Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/70 text-sm mb-1">Score</p>
              <p className="text-white font-semibold">
                {booking.scorePercentage !== undefined ? `${booking.scorePercentage}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Pass Percentage</p>
              <p className="text-white font-semibold">
                {booking.passPercentage !== undefined ? `${booking.passPercentage}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Result</p>
              <p className={`font-semibold ${booking.isPassed ? 'text-emerald-300' : 'text-red-300'}`}>
                {booking.isPassed === undefined ? '—' : booking.isPassed ? 'Passed' : 'Failed'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-semibold text-white mb-4">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Name</p>
            <p className="text-white">
              {booking.userInfo?.firstName
                ? `${booking.userInfo.firstName} ${booking.userInfo.lastName}`
                : '—'}
            </p>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-1">Email</p>
            <p className="text-white">{booking.userInfo?.email || '—'}</p>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-1">Phone</p>
            <p className="text-white">{booking.userInfo?.phone || '—'}</p>
          </div>

          {booking.userInfo?.age && (
            <div>
              <p className="text-white/70 text-sm mb-1">Age</p>
              <p className="text-white">{booking.userInfo.age}</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Location */}
      <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
        <h3 className="font-semibold text-white mb-4">Test Location</h3>

        <div className="space-y-3">
          <div>
            <p className="text-white/70 text-sm mb-1">Address</p>
            <p className="text-white">
              {booking.testLocation?.address || '—'}
            </p>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-1">City, State</p>
            <p className="text-white">
              {booking.testLocation?.city
                ? `${booking.testLocation.city}, ${booking.testLocation.state} ${booking.testLocation.zipCode}`
                : '—'}
            </p>
          </div>

          {booking.testLocation?.latitude !== undefined && booking.testLocation?.longitude !== undefined && (
            <div>
              <p className="text-white/70 text-sm mb-1">Coordinates</p>
              <p className="text-white text-xs font-mono">
                {booking.testLocation.latitude.toFixed(4)}, {booking.testLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Message */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/30 text-sm text-amber-200">
        <p>
          {booking.status === 'PENDING' && (
            <>You already have an active test booking. You cannot book another test while this one is pending. If you need to make changes, please contact support or cancel this booking first.</>
          )}
          {booking.status === 'RECEIVED' && (
            <>Your hallticket is issued. You cannot book another test until this one is completed.</>
          )}
          {booking.status === 'ATTENDED' && (
            <>Your test is marked as attended. Please wait for results before booking another test.</>
          )}
          {booking.status === 'CONFIRMED' && (
            <>You have a confirmed test scheduled. You cannot book another test at this time.</>
          )}
          {booking.status === 'RESULTS_PUBLISHED' && (
            <>Your results are available. You can book a new test if needed.</>
          )}
          {booking.status === 'COMPLETED' && (
            <>Your test has been completed. You can book a new test if needed.</>
          )}
          {booking.status === 'CANCELLED' && (
            <>This booking was cancelled. You can now book a new test.</>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {canBookAgain ? (
          <>
            <Button
              onClick={onNewBooking}
              className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black hover:brightness-95"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Book a New Test
            </Button>
          </>
        ) : (
          <>
            <Link href="/tests/book" className="w-full">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">
                View All Bookings
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
