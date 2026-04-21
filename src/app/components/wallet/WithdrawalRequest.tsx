"use client";

import { useState, useEffect, useRef } from "react";
import { requestWithdrawal, getProfileData, sendTransferOtp, getBiometricsStatus, requestCashWithdrawal, getUserCashWithdrawals, cancelUserCashWithdrawal } from "@/actions/user";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, Banknote, MapPin, Calendar, User, Phone, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-confetti";
import FaceVerificationPanel from "@/app/components/biometrics/FaceVerificationPanel";

interface WithdrawalRequestProps {
  currentBalance: number;
  kycStatus: string | undefined;
  className?: string;
  remainingWithdrawalLimit?: number;
}

type WithdrawalType = "crypto" | "upi" | "bank" | "cash";
type AuthMethod = "password" | "otp";
type VerificationMethod = "face" | "password" | "otp";

const WithdrawalRequest = ({
  currentBalance,
  kycStatus,
  className,
  remainingWithdrawalLimit,
}: WithdrawalRequestProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>("crypto");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    holderName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>("face");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [faceVerificationId, setFaceVerificationId] = useState<string | null>(null);
  const [faceApproved, setFaceApproved] = useState(true);
  const otpTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cash withdrawal state
  const [cashAmount, setCashAmount] = useState("");
  const [cashLoading, setCashLoading] = useState(false);
  const [cashWithdrawals, setCashWithdrawals] = useState<any[]>([]);
  const [cashWithdrawalsLoading, setCashWithdrawalsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (withdrawalType !== "cash") return;
    setCashWithdrawalsLoading(true);
    getUserCashWithdrawals().then((res) => {
      if (!res?.error && Array.isArray(res)) setCashWithdrawals(res);
      setCashWithdrawalsLoading(false);
    });
  }, [withdrawalType]);

  const handleCashWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cashAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    if (amt > currentBalance) { toast.error("Insufficient balance."); return; }
    setCashLoading(true);
    try {
      const res = await requestCashWithdrawal(amt);
      if (res?.error) { toast.error(res.error); }
      else {
        toast.success("Cash withdrawal requested. Amount held. Admin will schedule pickup.");
        setCashAmount("");
        setCashWithdrawals((prev) => [res, ...prev]);
      }
    } catch { toast.error("Request failed."); }
    finally { setCashLoading(false); }
  };

  const handleCancelCash = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await cancelUserCashWithdrawal(id);
      if (res?.error) { toast.error(res.error); }
      else {
        toast.success("Cash withdrawal cancelled. Amount refunded.");
        setCashWithdrawals((prev) => prev.map(c => c._id === id ? { ...c, status: 'CANCELLED' } : c));
      }
    } catch { toast.error("Cancel failed."); }
    finally { setCancellingId(null); }
  };

  const safeRemainingLimit =
    typeof remainingWithdrawalLimit === "number"
      ? Math.max(0, remainingWithdrawalLimit)
      : null;
  const maxWithdrawable =
    safeRemainingLimit !== null
      ? Math.min(currentBalance, safeRemainingLimit)
      : currentBalance;

  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await getProfileData();
      if (profileData && !profileData.error && profileData.usdtTrc20Address) {
        setWithdrawalAddress(profileData.usdtTrc20Address);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const otpCooldownEnd = localStorage.getItem("withdrawalOtpCooldownEnd");
    if (otpCooldownEnd) {
      const remainingTime = Math.ceil(
        (Number(otpCooldownEnd) - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        setOtpCooldown(remainingTime);
      } else {
        localStorage.removeItem("withdrawalOtpCooldownEnd");
      }
    }
  }, []);

  useEffect(() => {
    if (otpCooldown > 0) {
      otpTimerRef.current = setTimeout(() => {
        setOtpCooldown((prev) => prev - 1);
      }, 1000);
    } else if (otpTimerRef.current) {
      clearTimeout(otpTimerRef.current);
    }

    return () => {
      if (otpTimerRef.current) {
        clearTimeout(otpTimerRef.current);
      }
    };
  }, [otpCooldown]);

  const handleRequestOtp = async () => {
    setIsSendingOtp(true);
    setError(null);
    try {
      const result = await sendTransferOtp();
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(result?.message || "OTP sent successfully.");
      const cooldownEnd = Date.now() + 60 * 1000;
      localStorage.setItem("withdrawalOtpCooldownEnd", String(cooldownEnd));
      setOtpCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    setError(null);

    const withdrawalAmount = parseFloat(newAmount);
    if (!isNaN(withdrawalAmount) && withdrawalAmount > maxWithdrawable) {
      setError("Withdrawal amount cannot exceed your remaining withdrawal limit.");
    } else if (withdrawalType === "upi" && !isNaN(withdrawalAmount) && withdrawalAmount > 50) {
      setError("UPI withdrawal amount cannot exceed $50.");
    }
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const buildWithdrawalPayload = () => {
    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return null;
    }

    if (withdrawalAmount > maxWithdrawable) {
      toast.error("Withdrawal amount cannot exceed your remaining withdrawal limit.");
      return null;
    }

    if (withdrawalType === "upi" && withdrawalAmount > 50) {
      toast.error("UPI withdrawal amount cannot exceed $50.");
      return null;
    }

    const payload: {
      amount: number;
      withdrawalAddress?: string;
      upiId?: string;
      bankDetails?: {
        bankName: string;
        accountNumber: string;
        ifscCode: string;
        holderName: string;
      };
      otp?: string;
      password?: string;
      faceVerificationId?: string;
    } = { amount: withdrawalAmount };

    if (withdrawalType === "crypto") {
      if (!withdrawalAddress) {
        toast.error("Please set your USDT (TRC20) withdrawal address in your profile or enter it manually.");
        return null;
      }
      payload.withdrawalAddress = withdrawalAddress;
    } else if (withdrawalType === "upi") {
      if (!upiId) {
        toast.error("Please enter your UPI ID.");
        return null;
      }
      payload.upiId = upiId;
    } else if (withdrawalType === "bank") {
      if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.holderName) {
        toast.error("Please fill in all bank details.");
        return null;
      }
      payload.bankDetails = bankDetails;
    }

    return payload;
  };

  const handleProceedToVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = buildWithdrawalPayload();
    if (!payload) {
      return;
    }
    setStep(2);
  };

  useEffect(() => {
    if (step !== 2) return;
    getBiometricsStatus()
      .then((res) => {
        if (!res?.error) {
          setFaceEnrolled(Boolean(res.enrolled));
          setFaceApproved(res.approved === undefined ? true : Boolean(res.approved));
        }
      })
      .catch(() => null);
  }, [step]);

  useEffect(() => {
    if (verificationMethod !== "face") return;
    if (faceApproved) return;
    setVerificationMethod(user?.hasPasswordSet ? "password" : "otp");
  }, [faceApproved, verificationMethod, user?.hasPasswordSet]);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (verificationMethod === "face" && faceEnrolled && !faceVerificationId) {
      toast.error("Please verify your face before submitting.");
      setIsLoading(false);
      return;
    }

    if (verificationMethod === "otp" && (!otp || otp.length !== 6)) {
      toast.error("Please enter a valid 6-digit OTP.");
      setIsLoading(false);
      return;
    }

    if (verificationMethod === "password" && !password) {
      toast.error("Please enter your password.");
      setIsLoading(false);
      return;
    }

    const payload = buildWithdrawalPayload();
    if (!payload) {
      setIsLoading(false);
      return;
    }

    if (verificationMethod === "otp") {
      payload.otp = otp;
    } else if (verificationMethod === "password") {
      payload.password = password;
    } else if (verificationMethod === "face" && faceVerificationId) {
      payload.faceVerificationId = faceVerificationId;
    }

    try {
      const result = await requestWithdrawal(payload);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setAmount("");
        setUpiId("");
        setOtp("");
        setPassword("");
        setFaceVerified(false);
        setFaceVerificationId(null);
        setBankDetails({ bankName: "", accountNumber: "", ifscCode: "", holderName: "" });
        setStep(1);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (kycStatus !== "VERIFIED") {
    return (
      <Card className={`bg-gray-900 border-gray-800 flex flex-col ${className ?? ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center gap-3 bg-yellow-900/50 text-yellow-300 p-4 rounded-md">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Your KYC must be verified before you can make a withdrawal.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gray-900 border-gray-800 relative overflow-hidden flex flex-col ${className ?? ''}`}>
      {showConfetti && <Confetti />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Request Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Responsive Tabs/Dropdown */}
        <div className="sm:hidden mb-4">
          <select
            value={withdrawalType}
            onChange={(e) => setWithdrawalType(e.target.value as WithdrawalType)}
            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
          >
            <option value="crypto">Crypto</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div className="hidden sm:flex gap-2 mb-4 border-b border-gray-700">
          <Button variant={withdrawalType === "crypto" ? "secondary" : "ghost"} onClick={() => setWithdrawalType("crypto")}>
            Crypto
          </Button>
          <Button variant={withdrawalType === "upi" ? "secondary" : "ghost"} onClick={() => setWithdrawalType("upi")}>
            UPI
          </Button>
          <Button variant={withdrawalType === "bank" ? "secondary" : "ghost"} onClick={() => setWithdrawalType("bank")}>
            Bank
          </Button>
          <Button variant={withdrawalType === "cash" ? "secondary" : "ghost"} onClick={() => setWithdrawalType("cash")} className="flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" />
            Cash
          </Button>
        </div>
        {withdrawalType === "cash" && (
          <div className="flex flex-col gap-4">
            {/* Request form */}
            <form onSubmit={handleCashWithdrawal} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount (INR)</label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={`Available: ₹${currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  className="bg-gray-800 border-gray-600 text-white"
                  min="0.01"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount is held immediately. Admin will contact you with pickup details.
                </p>
              </div>
              <Button type="submit" disabled={cashLoading} className="w-full bg-emerald-600 hover:bg-emerald-500">
                {cashLoading ? "Requesting..." : "Request Cash Withdrawal"}
              </Button>
            </form>

            {/* Existing cash withdrawal requests */}
            <div className="space-y-2 mt-2">
              {cashWithdrawalsLoading && <p className="text-xs text-gray-400">Loading requests...</p>}
              {cashWithdrawals.map((cw) => (
                <div key={cw._id} className={`rounded-xl border p-3 space-y-2 text-sm ${
                  cw.status === 'CANCELLED' ? 'border-red-500/20 bg-red-500/5' :
                  cw.status === 'DELIVERED' ? 'border-emerald-500/20 bg-emerald-500/5' :
                  cw.status === 'SCHEDULED' ? 'border-blue-500/20 bg-blue-500/5' :
                  'border-gray-700 bg-gray-800/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">₹{cw.amount.toLocaleString('en-IN')}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      cw.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                      cw.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                      cw.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-600/40 text-gray-300'
                    }`}>{cw.status}</span>
                  </div>

                  {cw.status === 'SCHEDULED' && (
                    <div className="space-y-1 text-xs text-gray-300">
                      {cw.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-blue-400" />{cw.location}</div>}
                      {cw.scheduledAt && <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-blue-400" />{new Date(cw.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                      {cw.contactName && <div className="flex items-center gap-1.5"><User className="h-3 w-3 text-blue-400" />{cw.contactName}</div>}
                      {cw.contactPhone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-blue-400" />{cw.contactPhone}</div>}
                    </div>
                  )}

                  {cw.status === 'CANCELLED' && cw.cancelReason && (
                    <div className="flex items-start gap-1.5 text-xs text-red-300">
                      <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span>Reason: {cw.cancelReason}</span>
                    </div>
                  )}

                  {cw.status === 'DELIVERED' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Cash delivered on {new Date(cw.deliveredAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}

                  {['PENDING', 'SCHEDULED'].includes(cw.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                      disabled={cancellingId === cw._id}
                      onClick={() => handleCancelCash(cw._id)}
                    >
                      {cancellingId === cw._id ? "Cancelling..." : "Cancel Request"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {withdrawalType !== "cash" && step === 1 && (
          <form onSubmit={handleProceedToVerification} className="flex flex-col gap-4 flex-1">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
                Amount (INR)
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Available: ₹${maxWithdrawable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                required
                min="0.01"
                step="0.01"
              />
              {safeRemainingLimit !== null && (
                <p className="text-xs text-gray-500 mt-2">
                  Remaining withdrawal limit: ${maxWithdrawable.toFixed(2)}
                </p>
              )}
              {withdrawalType === "upi" && parseFloat(amount) > 50 && (
                <p className="text-red-400 text-sm mt-2">UPI withdrawal amount cannot exceed $50.</p>
              )}
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            {withdrawalType === "crypto" && (
              <div>
                <label htmlFor="withdrawalAddress" className="block text-sm font-medium text-gray-400 mb-2">
                  USDT (TRC20) Withdrawal Address
                </label>
                <Input
                  id="withdrawalAddress"
                  name="withdrawalAddress"
                  type="text"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  placeholder="Enter your withdrawal address"
                  className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This is pre-filled from your profile settings.</p>
              </div>
            )}

            {withdrawalType === "upi" && (
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-400 mb-2">
                  UPI ID
                </label>
                <Input
                  id="upiId"
                  name="upiId"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@oksbi"
                  className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  required
                />
              </div>
            )}

            {withdrawalType === "bank" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="holderName" className="block text-sm font-medium text-gray-400 mb-2">
                    Account Holder Name
                  </label>
                  <Input
                    id="holderName"
                    name="holderName"
                    type="text"
                    value={bankDetails.holderName}
                    onChange={handleBankDetailsChange}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-400 mb-2">
                    Account Number
                  </label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={handleBankDetailsChange}
                    placeholder="1234567890"
                    required
                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-400 mb-2">
                    IFSC Code
                  </label>
                  <Input
                    id="ifscCode"
                    name="ifscCode"
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={handleBankDetailsChange}
                    placeholder="SBIN0001234"
                    required
                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-400 mb-2">
                    Bank Name
                  </label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    value={bankDetails.bankName}
                    onChange={handleBankDetailsChange}
                    placeholder="State Bank of India"
                    required
                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <Button type="submit" className="w-full">
                Proceed to Verification
              </Button>
            </div>
          </form>
        )}

        {withdrawalType !== "cash" && step === 2 && (
          <form onSubmit={handleWithdrawalRequest} className="flex flex-col gap-4 flex-1">
            <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Verification</p>
              {!faceEnrolled && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  Enable face verification for extra security.
                  <button
                    type="button"
                    onClick={() => window.location.assign("/face-test?mode=enroll&next=/wallet")}
                    className="ml-2 underline"
                  >
                    Set up now
                  </button>
                </div>
              )}
              {faceEnrolled && !faceApproved && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Awaiting admin approval for face verification.
                </div>
              )}
              <div
                className={`grid gap-2 rounded-lg bg-gray-800/50 p-1 ${
                  faceApproved ? "sm:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                {faceApproved && (
                  <button
                    type="button"
                    onClick={() => setVerificationMethod("face")}
                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                      verificationMethod === "face"
                        ? "bg-emerald-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Use Face
                  </button>
                )}
                {user?.hasPasswordSet && (
                  <button
                    type="button"
                    onClick={() => setVerificationMethod("password")}
                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                      verificationMethod === "password"
                        ? "bg-emerald-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    Use Password
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setVerificationMethod("otp")}
                  className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                    verificationMethod === "otp"
                      ? "bg-emerald-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Use OTP
                </button>
              </div>
              {verificationMethod === "face" && faceApproved && (
                <FaceVerificationPanel
                  purpose="WITHDRAWAL"
                  enrollHref="/face-test?mode=enroll&next=/wallet"
                  onVerified={(passed) => setFaceVerified(passed)}
                  onEnrollmentChange={(isEnrolled) => setFaceEnrolled(isEnrolled)}
                  onVerificationToken={(token) => setFaceVerificationId(token?.verificationId ?? null)}
                  onApprovalChange={(approved) => setFaceApproved(approved)}
                />
              )}
              {verificationMethod === "password" ? (
                <div>
                  <label htmlFor="withdrawal-password" className="block text-sm font-medium text-gray-300 mb-1">
                    Enter Password
                  </label>
                  <Input
                    id="withdrawal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                    required
                  />
                </div>
              ) : verificationMethod === "otp" ? (
                <div className="space-y-2">
                  <label htmlFor="withdrawal-otp" className="block text-sm font-medium text-gray-300 mb-1">
                    Enter OTP
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="withdrawal-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                      required
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="sm:w-48"
                      variant="outline"
                    >
                      {isSendingOtp
                        ? "Sending..."
                        : otpCooldown > 0
                          ? `Resend OTP in ${otpCooldown}s`
                          : "Send OTP"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Submitting Request..." : "Request Withdrawal"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequest;
