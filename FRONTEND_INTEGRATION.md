# Sagenex Frontend Integration Guide

Complete implementation of Wallet Transfer and Test Booking flows with Stepper UIs, validation, and API integration.

## Project Structure

```
src/
├── lib/
│   ├── api.ts                    # HTTP client with auth/error handling
│   ├── validation.ts             # Zod schemas for all forms
│   └── bonuses.ts, roi.ts, utils.tsx (existing)
├── hooks/
│   ├── useTransfer.ts            # Wallet transfer logic + OTP
│   └── useTestBooking.ts         # Test booking + CRUD operations
├── components/
│   ├── common/
│   │   └── Stepper.tsx           # Generic horizontal stepper
│   ├── wallet/
│   │   ├── Step1TransferDetails.tsx
│   │   ├── Step2RequestOtp.tsx
│   │   ├── Step3ExecuteTransfer.tsx
│   │   ├── Step4Confirmation.tsx
│   │   └── TransferStepper.tsx   # Container
│   └── tests/
│       ├── TestStep1BasicInfo.tsx
│       ├── TestStep2Location.tsx
│       ├── TestStep4ReviewConfirm.tsx    # Step 3 in flow (admin schedules later)
│       ├── TestStep5Confirmation.tsx     # Step 4 in flow
│       └── TestBookingStepper.tsx # Container
└── pages/ (app/)
    └── [Create pages as needed]
```

## Installation & Setup

### 1. Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

### 2. API Client Usage

The API client (`lib/api.ts`) automatically:
- Injects `Authorization: Bearer {token}` header
- Handles 401 errors by clearing auth and redirecting to `/login`
- Returns parsed JSON response or throws structured errors

```typescript
import { api } from '@/lib/api';

// GET request
const data = await api.get('/wallet');

// POST request
const res = await api.post('/wallet/transfer/send-otp', {
  recipientId: 'U001',
  amount: 50,
  transferType: 'TO_AVAILABLE_BALANCE',
});
```

## Wallet Transfer Flow

### Flow: 4 Steps

```
[Details] → [OTP Request] → [Execute] → [Confirmation]
```

### Step 1: Transfer Details
- Input: Recipient ID, Amount, Transfer Type
- Validation: Zod schema ensures required fields
- Action: Enable "Next" only when form is valid
- File: `components/wallet/Step1TransferDetails.tsx`

### Step 2: Request OTP
- Action: `POST /wallet/transfer/send-otp`
- Response: `{ message: string }`
- UI:
  - Show 60s resend cooldown
  - Display 10-minute OTP validity countdown
  - Show success/error messages
- File: `components/wallet/Step2RequestOtp.tsx`

### Step 3: Execute Transfer
- Inputs: OTP (6 digits), Password
- Action: `POST /wallet/transfer/execute`
  - Body includes unique `idempotencyKey` (generated per attempt)
  - Prevents duplicate transactions
- Response: `{ message: string, transactionId: string }`
- File: `components/wallet/Step3ExecuteTransfer.tsx`

### Step 4: Confirmation
- Display: Transaction ID, Amount, Recipient, Timestamp
- Actions:
  - "View Wallet" (navigate to /wallet)
  - "Make Another Transfer" (reset stepper)
- File: `components/wallet/Step4Confirmation.tsx`

### Container Component

Use `TransferStepper` component in your page:

```tsx
import { TransferStepper } from '@/components/wallet/TransferStepper';

export default function WalletPage() {
  return (
    <div>
      <TransferStepper />
    </div>
  );
}
```

## Test Booking Flow

### Flow: 5 Steps

```
[Personal Info] → [Location] → [Schedule] → [Review] → [Confirmation]
```

### Step 1: Personal Info
- Inputs: firstName, lastName, email, phone, age (optional)
- Validation: Email format, phone format, required fields
- File: `components/tests/TestStep1BasicInfo.tsx`

### Step 2: Location
- Inputs: Latitude, Longitude, Address, City, State, Zip Code
- Feature: "Use Current Location" button (HTML5 Geolocation API)
- File: `components/tests/TestStep2Location.tsx`

### Step 3: Review & Confirm
- Display: 
  - Summary of user info (firstName, lastName, email, phone, age)
  - Location details (address, city, state, zipCode, coordinates)
  - Test type
  - $50 fee notice
- Admin scheduling notice: "Test date will be scheduled by admin. You'll receive a confirmation email."
- Action: `POST /tests/schedule`
  - Body: User info + location (NO testDate - admin schedules it)
- Response: `{ bookingId, transactionId, status: 'PENDING', message, booking }`
- File: `components/tests/TestStep4ReviewConfirm.tsx`

### Step 4: Confirmation
- Display: 
  - Success message
  - Booking ID
  - Transaction ID
  - Status badge: "PENDING" (awaiting admin scheduling)
  - $50 fee summary
- Info message: "An admin will review your details and schedule the test date. You'll receive a confirmation email with the scheduled date and time."
- Actions:
  - "View All Bookings"
  - "Back to Dashboard"
- File: `components/tests/TestStep5Confirmation.tsx`

### Container Component

Use `TestBookingStepper` in your page:

```tsx
import { TestBookingStepper } from '@/components/tests/TestBookingStepper';

export default function TestsPage() {
  return (
    <div>
      <TestBookingStepper testType="Medical Test" />
    </div>
  );
}
```

## Booking Status Flow

Users follow this path after initial booking:

```
PENDING (awaiting admin) → CONFIRMED (admin scheduled) → COMPLETED (test done) or CANCELLED
```

- **PENDING**: Booking submitted, admin reviewing location and user details
- **CONFIRMED**: Admin has scheduled the test date; user received confirmation email with scheduled date/time
- **COMPLETED**: Test completed successfully
- **CANCELLED**: User or admin cancelled; $50 refunded to user

## Hooks Reference

### useTransfer()

```typescript
const {
  status,           // 'idle' | 'loading' | 'success' | 'error'
  error,           // Error message from API
  message,         // Success message
  transactionId,   // ID on successful transfer
  otpValidUntil,   // Date when OTP expires
  idempotencyKey,  // Unique key for this transfer
  requestOtp,      // async (details) => Promise
  executeTransfer, // async (details, otpPassword) => Promise
  reset,           // () => void
} = useTransfer();
```

### useTestBooking()

```typescript
const {
  status,        // 'idle' | 'loading' | 'success' | 'error'
  error,         // Error message from API
  message,       // Success message
  bookingId,     // ID on successful booking
  transactionId, // Payment transaction ID
  bookings,      // Array of user's bookings
  currentBooking, // Current selected booking
  scheduleTest,  // async (bookingData) => Promise
  fetchBookings, // async () => Promise
  fetchBooking,  // async (bookingId) => Promise
  cancelBooking, // async (bookingId, reason?) => Promise
  reset,         // () => void
} = useTestBooking();
```

## Validation Schemas (Zod)

All schemas are in `lib/validation.ts`:

- `transferDetailsSchema` → `TransferDetails`
- `transferOtpSchema` → `TransferOtp`
- `transferExecuteSchema` → `TransferExecute`
- `testBookingBasicInfoSchema` → `TestBookingBasicInfo`
- `testBookingLocationSchema` → `TestBookingLocation`
- `testBookingScheduleSchema` → `TestBookingSchedule`
- `testBookingSchema` → `TestBooking` (full booking)

Use with `react-hook-form`:

```typescript
const { register, handleSubmit, formState: { errors } } = useForm<TransferDetails>({
  resolver: zodResolver(transferDetailsSchema),
});
```

## Error Handling

API errors are mapped to friendly messages:

- **400**: Validation error (e.g., insufficient funds)
  - Display: `error.data.message`
- **403**: Unauthorized (e.g., invalid OTP, lockout)
  - Display: `error.data.message` + `remainingAttempts`
- **409**: Duplicate (e.g., duplicate transfer key)
  - Handle: Generate new `idempotencyKey` and retry
- **429**: Rate limit (e.g., velocity limit)
  - Display: `error.data.message`
- **401**: Unauthorized (token expired)
  - Action: Auto-logout, redirect to `/login`

## Example Usage

### Using TransferStepper in a page:

```tsx
'use client';

import { TransferStepper } from '@/components/wallet/TransferStepper';

export default function TransferPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wallet Transfer</h1>
        <TransferStepper />
      </div>
    </main>
  );
}
```

### Using TestBookingStepper in a page:

```tsx
'use client';

import { TestBookingStepper } from '@/components/tests/TestBookingStepper';

export default function BookTestPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Book a Test</h1>
        <TestBookingStepper testType="Medical Screening" />
      </div>
    </main>
  );
}
```

## API Contracts

### Wallet Transfer

**Request OTP:**
```
POST /wallet/transfer/send-otp
{
  "recipientId": "U001",
  "amount": 50,
  "transferType": "TO_AVAILABLE_BALANCE"
}

Response:
{
  "message": "OTP sent successfully"
}
```

**Execute Transfer:**
```
POST /wallet/transfer/execute
{
  "recipientId": "U001",
  "amount": 50,
  "transferType": "TO_AVAILABLE_BALANCE",
  "otp": "123456",
  "password": "myPassword",
  "idempotencyKey": "xfer-1703020800000-abc123"
}

Response:
{
  "message": "Transfer successful",
  "transactionId": "txn-abc123"
}
```

### Test Booking

**Schedule Test:**
```
POST /tests/schedule
{
  "testType": "Medical Test",
  "testLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1 555-123-4567",
    "age": 30
  }
}

Response:
{
  "bookingId": "book-123",
  "transactionId": "txn-456",
  "status": "PENDING",
  "message": "Test booking submitted successfully. An admin will schedule your test date.",
  "booking": { ... }
}
```

**Note:** `testDate` is NOT included in the user's booking request. The admin will schedule it and send a confirmation email when the status changes to `CONFIRMED`.

**Get All Bookings:**
```
GET /tests

Response:
{
  "bookings": [ ... ],
  "count": 5
}
```

**Cancel Booking:**
```
POST /tests/:bookingId/cancel
{
  "reason": "Schedule conflict"
}

Response:
{
  "bookingId": "book-123",
  "status": "CANCELLED",
  "refundAmount": 50,
  "message": "Booking cancelled successfully"
}
```

## UI Components Used

- **Button**: `/components/ui/button.tsx`
- **Input**: `/components/ui/input.tsx`
- **Label**: `/components/ui/label.tsx`
- **Icons**: Lucide React (`AlertCircle`, `Check`, `Clock`, `MapPin`, `Calendar`)
- **Toast**: `sonner` package (already installed)

## Security Notes

1. **Idempotency**: Generate unique `idempotencyKey` per transfer attempt
2. **Password**: Never logged or persisted; only sent with OTP on execute
3. **Auth Token**: Stored in `localStorage`, injected in all requests
4. **401 Handling**: Clears token and redirects to login
5. **HTTPS**: Use in production only

## Testing

### Manual API Testing

Use curl or Postman with auth header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/wallet/transfer/send-otp \
  -X POST \
  -d '{"recipientId":"U001","amount":50,"transferType":"TO_AVAILABLE_BALANCE"}' \
  -H "Content-Type: application/json"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token in localStorage; re-login if expired |
| 400 Validation Error | Check form inputs match schema; see error.data.message |
| 429 Too Many Requests | Wait before retrying; respect rate limits |
| OTP Expired | Request new OTP; previous OTP becomes invalid |
| Duplicate Transfer | Use new `idempotencyKey`; old transaction already processed |

## Next Steps

1. Create pages at `/app/wallet/transfer` and `/app/tests/book`
2. Add navigation links to main app
3. Integrate with balance refresh after successful transfer/booking
4. Add booking management page to view/cancel tests
5. Add analytics/logging for transfers and bookings

---

**Last Updated:** December 26, 2025
