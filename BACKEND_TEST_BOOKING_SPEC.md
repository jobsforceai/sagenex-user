# Backend Specification: Test Booking API

## Overview
Implement a test booking system where users can schedule medical/lab tests. The booking flow charges $50 from the user's wallet (credited to admin account U001), and the admin later assigns a test date.

**Security:** Uses OTP verification + password confirmation before processing $50 payment.

---

## API Endpoints

### 1. POST `/api/v1/tests/send-otp`

Send OTP for test booking verification (similar to wallet transfer OTP flow).

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "testType": "Medical Screening",
  "amount": 50,
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
```

**Success Response (200):**
```json
{
  "message": "OTP sent to your registered email/phone",
  "otpValidUntil": "2025-12-26T10:40:00.000Z",
  "remainingAttempts": 3
}
```

**Business Logic:**
- Validate user's wallet has at least $50
- Generate 6-digit OTP
- Store OTP in cache/DB with 10-minute expiry
- Bind OTP to: userId + testType + amount + location hash
- Send OTP via email/SMS
- Track attempt count (max 3 OTP requests per 10 minutes)

---

### 2. POST `/api/v1/tests/schedule`

Schedule test booking after OTP + password verification.

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "testType": "Medical Screening",
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
  },
  "otp": "123456",
  "password": "userPassword123",
  "idempotencyKey": "book_1703620800000_abc123"
}
```

**Success Response (200):**
```json
{
  "bookingId": "book_abc123",
  "transactionId": "txn_xyz789",
  "status": "PENDING",
  "message": "Test booking submitted successfully. An admin will schedule your test date.",
  "booking": {
    "bookingId": "book_abc123",
    "testType": "Medical Screening",
    "status": "PENDING",
    "testDate": null,
    "testLocation": { /* same as request */ },
    "userInfo": { /* same as request */ },
    "paymentTransactionId": "txn_xyz789",
    "transactionDetails": {
      "debitedFrom": "user_wallet_id",
      "creditedTo": "U001",
      "amount": 50,
      "timestamp": "2025-12-26T10:30:00.000Z"
    },
    "createdAt": "2025-12-26T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid OTP, invalid password, insufficient balance, duplicate idempotency key
- `401 Unauthorized`: No token or invalid token
- `403 Forbidden`: OTP expired, max OTP attempts exceeded, account locked
- `409 Conflict`: Duplicate idempotency key (booking already processed)
- `500 Internal Server Error`: Database or server error

---

## Business Logic

### Flow Overview
```
User submits booking details → Send OTP → User enters OTP + Password → Verify & Process Payment → Create Booking
```

### 1. Send OTP (`/tests/send-otp`)

**Validation:**
- Verify all required fields are present
- Validate email format, phone number format
- Ensure latitude/longitude are valid numbers
- Check user's wallet has at least $50 available balance

**OTP Generation:**
- Generate 6-digit random OTP
- Store in Redis/cache with key: `test_otp:${userId}`
- Include metadata: `{ otp, testType, amount, locationHash, expiresAt, attempts: 0 }`
- TTL: 10 minutes
- Hash location to bind OTP to specific booking details

**Rate Limiting:**
- Max 3 OTP requests per 10 minutes per user
- If exceeded, return 429 or lock for 10 minutes

**Send OTP:**
- Send via email and/or SMS
- Template: "Your test booking OTP is {otp}. Valid for 10 minutes. Amount: $50"

### 2. Schedule Test (`/tests/schedule`)

**Step 1: Verify OTP**
- Retrieve OTP from cache using userId
- Check OTP hasn't expired (10 minutes)
- Verify OTP matches user input
- Verify OTP was generated for same testType + amount + location
- Increment attempt counter
- Max 3 incorrect OTP attempts before locking

**Step 2: Verify Password**
- Hash input password and compare with user's stored password hash
- If incorrect, return 400 error
- Max 3 incorrect password attempts before temporary lock

**Step 3: Idempotency Check**
- Check if `idempotencyKey` already exists in processed bookings
- If exists, return existing booking (don't deduct again)
- Prevents duplicate charges if user clicks submit multiple times

**Step 4: Wallet Transaction**
**Step 4: Wallet Transaction**
- Check user's wallet has at least $50 available balance (double-check)
- Create wallet transaction:
  - **Debit**: $50 from user's `availableBalance`
  - **Credit**: $50 to admin account `U001` (hardcoded recipient)
  - **Type**: `TEST_BOOKING_FEE` ← **IMPORTANT: Add this to WalletLedger enum**
- Transaction should be atomic (use MongoDB transaction/session)

**Step 5: Create Test Booking**
- Create new TestBooking document with:
  - `bookingId`: Generate unique ID (e.g., `book_${timestamp}_${randomString}`)
  - `userId`: From authenticated user's token
  - `testType`: From request
  - `status`: `PENDING` (admin will change to `CONFIRMED` when scheduling)
  - `testDate`: `null` initially (admin will set this later)
  - `testLocation`: From request
  - `userInfo`: From request
  - `paymentTransactionId`: ID of the wallet transaction created above
  - `idempotencyKey`: Store for duplicate prevention
  - `createdAt`: Current timestamp

**Step 6: Cleanup**
- Delete OTP from cache (one-time use)
- Clear attempt counters

**Step 7: Return Response**
- Return booking details with transaction ID
- Include clear message that admin will schedule the test date

---

## Database Schema Changes

### 1. **WalletLedger Model**
Add new enum value to `type` field:

```javascript
// models/WalletLedger.js (or wherever your schema is defined)
const walletLedgerSchema = new mongoose.Schema({
  // ... existing fields
  type: {
    type: String,
    enum: [
      'DEPOSIT',
      'WITHDRAWAL',
      'TRANSFER',
      'PACKAGE_PURCHASE',
      'ROI_CREDIT',
      'BONUS',
      'REFERRAL_BONUS',
      'TEST_BOOKING_FEE',  // ← ADD THIS LINE
      // ... any other existing enum values
    ],
    required: true
  },
  // ... rest of schema
});
```

### 2. **TestBooking Model (Create New)**
```javascript
const testBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
    required: true
  },
  testDate: {
    type: Date,
    default: null  // Admin will set this later
  },
  testLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  userInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number }
  },
  paymentTransactionId: {
    type: String,
    required: true
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transactionDetails: {
    debitedFrom: String,
    creditedTo: String,
    amount: Number,
    timestamp: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TestBooking', testBookingSchema);
```

---

## Implementation Steps

### Step 1: Update WalletLedger Schema
1. Add `'TEST_BOOKING_FEE'` to the enum array in `WalletLedger` model
2. Restart server to apply schema changes

### Step 2: Create TestBooking Model
1. Create new file: `models/TestBooking.js` (or similar)
2. Define schema as shown above
3. Export model

### Step 3: Implement Controller
```javascript
// controllers/testController.js (example)
const TestBooking = require('../models/TestBooking');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const User = require('../models/User');
const redis = require('redis');
const crypto = require('crypto');
const mongoose = require('mongoose');

const redisClient = redis.createClient();

// Send OTP
exports.sendTestOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { testType, amount, testLocation, userInfo } = req.body;

    // Validate request
    if (!testType || !testLocation || !userInfo || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check wallet balance
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet || userWallet.availableBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check OTP rate limit (max 3 requests per 10 minutes)
    const otpKey = `test_otp_requests:${userId}`;
    const requests = await redisClient.incr(otpKey);
    if (requests === 1) {
      await redisClient.expire(otpKey, 600); // 10 minutes
    }
    if (requests > 3) {
      return res.status(429).json({ message: 'Too many OTP requests. Try again later.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create location hash to bind OTP to specific booking details
    const locationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ testType, amount, ...testLocation }))
      .digest('hex');

    // Store OTP in Redis with metadata
    const otpData = {
      otp,
      testType,
      amount,
      locationHash,
      attempts: 0,
      createdAt: Date.now(),
    };
    await redisClient.setex(`test_otp:${userId}`, 600, JSON.stringify(otpData)); // 10 minutes

    // Send OTP via email/SMS (implement actual sending)
    console.log(`[TEST OTP] User ${userId}: ${otp}`);
    // await sendOtpEmail(userInfo.email, otp);
    // await sendOtpSMS(userInfo.phone, otp);

    res.status(200).json({
      message: 'OTP sent to your registered email/phone',
      otpValidUntil: new Date(Date.now() + 600000),
      remainingAttempts: 3,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to send OTP' });
  }
};

// Schedule test booking
exports.scheduleTest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { testType, testLocation, userInfo, otp, password, idempotencyKey } = req.body;

    // ===== STEP 1: Verify OTP =====
    const otpKey = `test_otp:${userId}`;
    const otpDataStr = await redisClient.get(otpKey);

    if (!otpDataStr) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'OTP expired or not sent. Request a new OTP.' });
    }

    const otpData = JSON.parse(otpDataStr);

    // Check OTP attempt limit
    if (otpData.attempts >= 3) {
      await redisClient.del(otpKey);
      await session.abortTransaction();
      return res.status(403).json({ message: 'Maximum OTP attempts exceeded. Request a new OTP.' });
    }

    // Verify OTP value
    if (otpData.otp !== otp) {
      otpData.attempts++;
      await redisClient.setex(otpKey, 600, JSON.stringify(otpData));
      await session.abortTransaction();
      return res.status(400).json({
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`,
      });
    }

    // Verify location hash matches
    const locationHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ testType, amount: 50, ...testLocation }))
      .digest('hex');

    if (locationHash !== otpData.locationHash) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking details have changed. Request a new OTP.' });
    }

    // ===== STEP 2: Verify Password =====
    const user = await User.findById(userId).session(session);
    if (!user || !user.password) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'User not found or password not set' });
    }

    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid password' });
    }

    // ===== STEP 3: Idempotency Check =====
    const existingBooking = await TestBooking.findOne({ idempotencyKey }).session(session);
    if (existingBooking) {
      await session.abortTransaction();
      return res.status(200).json({
        bookingId: existingBooking.bookingId,
        transactionId: existingBooking.paymentTransactionId,
        status: existingBooking.status,
        message: 'Test booking already processed',
        booking: existingBooking,
      });
    }

    // ===== STEP 4: Wallet Transaction =====
    const amount = 50;
    const userWallet = await Wallet.findOne({ userId }).session(session);

    if (!userWallet || userWallet.availableBalance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Find admin (U001) wallet
    const adminUser = await User.findOne({ userId: 'U001' }).session(session);
    if (!adminUser) {
      await session.abortTransaction();
      return res.status(500).json({ message: 'Admin user not found' });
    }

    const adminWallet = await Wallet.findOne({ userId: adminUser._id }).session(session);

    // Create transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Debit from user
    await Wallet.updateOne(
      { userId },
      { $inc: { availableBalance: -amount } },
      { session }
    );

    // Credit to admin
    await Wallet.updateOne(
      { userId: adminUser._id },
      { $inc: { availableBalance: amount } },
      { session }
    );

    // Create ledger entry for user (debit)
    await WalletLedger.create(
      [{
        userId,
        transactionId,
        type: 'TEST_BOOKING_FEE',
        amount: -amount,
        balanceAfter: userWallet.availableBalance - amount,
        description: `Test booking fee for ${testType}`,
        relatedUserId: adminUser._id,
        createdAt: new Date(),
      }],
      { session }
    );

    // Create ledger entry for admin (credit)
    await WalletLedger.create(
      [{
        userId: adminUser._id,
        transactionId,
        type: 'TEST_BOOKING_FEE',
        amount,
        balanceAfter: adminWallet.availableBalance + amount,
        description: `Test booking fee received from user`,
        relatedUserId: userId,
        createdAt: new Date(),
      }],
      { session }
    );

    // ===== STEP 5: Create Test Booking =====
    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const booking = await TestBooking.create(
      [{
        bookingId,
        userId,
        testType,
        status: 'PENDING',
        testDate: null,
        testLocation,
        userInfo,
        paymentTransactionId: transactionId,
        idempotencyKey,
        transactionDetails: {
          debitedFrom: userWallet._id.toString(),
          creditedTo: adminWallet._id.toString(),
          amount,
          timestamp: new Date(),
        },
        createdAt: new Date(),
      }],
      { session }
    );

    // ===== STEP 6: Cleanup =====
    await redisClient.del(otpKey);

    // ===== STEP 7: Commit & Response =====
    await session.commitTransaction();

    res.status(200).json({
      bookingId,
      transactionId,
      status: 'PENDING',
      message: 'Test booking submitted successfully. An admin will schedule your test date.',
      booking: booking[0],
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Schedule test error:', error);
    res.status(500).json({ message: error.message || 'Failed to schedule test' });
  } finally {
    session.endSession();
  }
};
```

### Step 4: Create Route
```javascript
// routes/testRoutes.js
const express = require('express');
const router = express.Router();
const { scheduleTest } = require('../controllers/testController');
const authMiddleware = require('../middleware/auth');

router.post('/schedule', authMiddleware, scheduleTest);

module.exports = router;
```

### Step 5: Register Route in Main App
```javascript
// app.js or server.js
const testRoutes = require('./routes/testRoutes');
app.use('/api/v1/tests', testRoutes);
```

---

## Additional Endpoints (Future)

### GET `/api/v1/tests`
List all bookings for authenticated user

### GET `/api/v1/tests/:bookingId`
Get details of specific booking

### POST `/api/v1/tests/:bookingId/cancel`
Cancel booking and refund $50 to user

---

## Status Flow

```
PENDING → CONFIRMED → COMPLETED
   ↓
CANCELLED (refund $50)
```

- **PENDING**: User submitted booking, awaiting admin scheduling
- **CONFIRMED**: Admin assigned test date, sent confirmation email
- **COMPLETED**: Test completed successfully
- **CANCELLED**: Booking cancelled (by user or admin), $50 refunded

---

## Admin Features (Separate Admin Panel)

Admin should be able to:
1. View all PENDING bookings
2. Assign `testDate` to a booking
3. Change status from PENDING → CONFIRMED
4. Send email notification to user with test date
5. Cancel bookings and process refunds

---

## Testing

### Test Case 1: Successful Booking
```bash
curl -X POST http://localhost:8080/api/v1/tests/schedule \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "Blood Test",
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
      "phone": "+1234567890",
      "age": 30
    }
  }'
```

### Test Case 2: Insufficient Balance
Ensure wallet has less than $50, expect 400 error

### Test Case 3: Missing Fields
Send incomplete data, expect 400 validation error

---

## Security Considerations

1. **Authorization**: Verify user owns the wallet being debited
2. **Atomic Transactions**: Use MongoDB sessions to ensure wallet debit/credit happens together
3. **Idempotency**: Consider adding idempotency key to prevent duplicate bookings
4. **Input Validation**: Sanitize all inputs, validate email/phone formats
5. **Rate Limiting**: Limit bookings per user (e.g., max 5 pending bookings)

---

## Error Messages

- `"Missing required fields"` - When testType, testLocation, or userInfo missing
- `"Insufficient wallet balance"` - When user has less than $50
- `"Maximum pending bookings reached"` - If implementing rate limiting
- `"Invalid email format"` - Email validation failed
- `"Invalid phone number"` - Phone validation failed

---

## Notes

- Fixed booking fee: **$50**
- Fixed recipient: **U001** (admin account)
- Initial status: **PENDING** (admin schedules later)
- Transaction type: **TEST_BOOKING_FEE** (must be added to enum)
- Test date: **null** until admin assigns it
