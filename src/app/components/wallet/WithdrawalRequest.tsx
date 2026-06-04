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
  /**
   * Daily (rolling 24-hour) withdrawal limit remaining, in INR.
   * Backend rule: dailyLimit = packageUSD; reduced by gross of any
   * WITHDRAWAL_REQUEST entries (PENDING|PAID) in the trailing 24h.
   * When provided, the MAX button caps at min(balance, lifetimeLimit,
   * dailyRemaining) instead of just the wallet balance — preventing
   * the "daily limit exceeded" rejection on submit.
   */
  dailyWithdrawalRemaining?: number;
  /** Total daily limit (= packageUSD) — shown in the UI so users
   *  understand why a higher amount is blocked. */
  dailyWithdrawalLimit?: number;
}

type WithdrawalType = "upi" | "bank" | "cash";
type AuthMethod = "password" | "otp";
type VerificationMethod = "face" | "password" | "otp";

const WithdrawalRequest = ({
  currentBalance,
  kycStatus,
  className,
  remainingWithdrawalLimit,
  dailyWithdrawalRemaining,
  dailyWithdrawalLimit,
}: WithdrawalRequestProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>("bank");
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
    if (!/^[0-9]+$/.test(cashAmount)) { toast.error("Enter a whole rupee amount (no paise)."); return; }
    const amt = parseInt(cashAmount, 10);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    // Gross-input model (team directive 2026-06-01):
    //   amt = wallet debit. tax = 5% × amt. user receives amt × 0.95.
    if (amt > maxWithdrawable) {
      const netCash = Math.round(amt * 0.95 * 100) / 100;
      let reason: string;
      if (amt > currentBalance) {
        reason = `but you only have ₹${currentBalance.toFixed(2)} in your wallet`;
      } else if (typeof dailyWithdrawalRemaining === "number" && amt > dailyWithdrawalRemaining) {
        reason = `exceeds your remaining 24-hour limit of ₹${dailyWithdrawalRemaining.toFixed(2)}`;
      } else {
        reason = `exceeds your remaining withdrawal cap of ₹${maxWithdrawable.toFixed(2)}`;
      }
      toast.error(`Cannot withdraw ₹${amt.toFixed(2)} (₹${netCash.toFixed(2)} in hand after 5% tax) — ${reason}.`);
      return;
    }
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
  const safeDailyRemaining =
    typeof dailyWithdrawalRemaining === "number"
      ? Math.max(0, dailyWithdrawalRemaining)
      : null;
  // Max withdrawable in one request = the tightest of:
  //   - wallet available balance
  //   - lifetime withdrawal cap remaining
  //   - rolling-24h daily limit remaining (= packageUSD - withdrawnInLast24h)
  // Prior bug: only the first two were considered, so MAX would fill in
  // a number the backend rejected with "daily limit exceeded".
  const candidates = [currentBalance];
  if (safeRemainingLimit !== null) candidates.push(safeRemainingLimit);
  if (safeDailyRemaining !== null) candidates.push(safeDailyRemaining);
  const maxWithdrawable = Math.max(0, Math.min(...candidates));
  // Gross-input model: the amount the user enters IS the wallet debit (gross).
  // What lands in their hand / bank = entered × 0.95 (5% tax kept by company).
  // maxWithdrawable is already the max gross — use it as-is for the form input.
  const maxNetReceivable = Math.floor((maxWithdrawable * 0.95) * 100) / 100;
  // Which limit is the binding constraint right now? (drives the helper
  // text under the amount field so users understand WHY the max is what
  // it is — particularly important when daily limit < wallet balance.)
  const bindingLimit =
    safeDailyRemaining !== null && maxWithdrawable === safeDailyRemaining
      ? "daily"
      : safeRemainingLimit !== null && maxWithdrawable === safeRemainingLimit
        ? "lifetime"
        : "balance";

  useEffect(() => {
    const fetchProfile = async () => {
      await getProfileData();
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
    // Strip any decimal/paise input — withdrawals must be whole rupees only.
    const sanitized = e.target.value.replace(/[^0-9]/g, "");
    setAmount(sanitized);
    setError(null);

    const withdrawalAmount = parseInt(sanitized, 10);
    if (sanitized && (isNaN(withdrawalAmount) || withdrawalAmount <= 0)) {
      setError("Enter a whole rupee amount (no paise).");
      return;
    }
    // Gross-input model: entered amount IS the wallet debit. Tax 5% deducted from it.
    const grossAmount = !isNaN(withdrawalAmount) && withdrawalAmount > 0 ? withdrawalAmount : 0;
    if (!isNaN(withdrawalAmount) && grossAmount > maxWithdrawable) {
      setError("Withdrawal amount exceeds your remaining withdrawal limit.");
    } else if (withdrawalType === "upi" && grossAmount > 500) {
      setError(`UPI withdrawal cannot exceed ₹500. (You will receive ₹${Math.floor(500 * 0.95)} after 5% tax.)`);
    } else if (withdrawalType === "bank" && grossAmount > 0 && grossAmount < 500) {
      setError(`Bank withdrawal must be at least ₹500. (You will receive ₹${Math.ceil(500 * 0.95)} after 5% tax.)`);
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

    // Gross-input model: entered amount IS the wallet debit. Tax 5% deducted from it.
    const grossAmount = withdrawalAmount;

    if (grossAmount > maxWithdrawable) {
      toast.error("Withdrawal amount exceeds your remaining withdrawal limit.");
      return null;
    }

    if (withdrawalType === "upi" && grossAmount > 500) {
      toast.error(`UPI withdrawal cannot exceed ₹500. You will receive ₹${(500 * 0.95).toFixed(2)} after 5% tax.`);
      return null;
    }

    if (withdrawalType === "bank" && grossAmount < 500) {
      toast.error(`Bank withdrawal must be at least ₹500. You will receive ₹${(500 * 0.95).toFixed(2)} after 5% tax.`);
      return null;
    }

    const payload: {
      amount: number;
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

    if (withdrawalType === "upi") {
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
      <Card className={`flex flex-col border border-[#E8E8E8] bg-white ${className ?? ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#111827]">
            <DollarSign className="w-5 h-5" />
            Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Your KYC must be verified before you can make a withdrawal.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative flex flex-col overflow-hidden border border-[#E8E8E8] bg-white ${className ?? ''}`}>
      {showConfetti && <Confetti />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#111827]">
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
            className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
          >
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div className="mb-4 hidden gap-2 border-b border-[#E8E8E8] sm:flex">
          <Button variant={withdrawalType === "upi" ? "secondary" : "ghost"} className="text-[#111827]" onClick={() => setWithdrawalType("upi")}>
            UPI
          </Button>
          <Button variant={withdrawalType === "bank" ? "secondary" : "ghost"} className="text-[#111827]" onClick={() => setWithdrawalType("bank")}>
            Bank
          </Button>
          <Button variant={withdrawalType === "cash" ? "secondary" : "ghost"} onClick={() => setWithdrawalType("cash")} className="flex items-center gap-1 text-[#111827]">
            <Banknote className="h-3.5 w-3.5" />
            Cash
          </Button>
        </div>
        {withdrawalType === "cash" && (
          <div className="flex flex-col gap-4">
            {/* Request form */}
            <form onSubmit={handleCashWithdrawal} className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">Amount (INR)</label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder={`Max withdrawal: ₹${Math.floor(maxWithdrawable).toLocaleString('en-IN')}`}
                  className="border-[#E8E8E8] bg-white text-[#111827]"
                  min="1"
                  step="1"
                />
                <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs">
                  <span className="font-bold text-emerald-700">
                    Max withdrawal: ₹{Math.floor(maxWithdrawable).toLocaleString('en-IN')} (you receive ₹{maxNetReceivable.toLocaleString('en-IN')} after 5% tax)
                  </span>
                  <button
                    type="button"
                    onClick={() => setCashAmount(String(Math.floor(maxWithdrawable)))}
                    className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                  >
                    Use Max
                  </button>
                </div>
                {bindingLimit === "daily" && typeof dailyWithdrawalLimit === "number" && (
                  <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                    Daily limit: ₹{Math.floor(dailyWithdrawalLimit).toLocaleString('en-IN')} in any 24-hour window. You can request the remaining ₹{Math.floor(Math.max(0, dailyWithdrawalLimit - maxWithdrawable)).toLocaleString('en-IN')} after 24 hours.
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  Amount is held immediately. Admin will contact you with pickup details.
                </p>
                {(() => {
                  // Gross-input model: entered amount = wallet debit. Tax = 5% of it. Net = 95%.
                  const gross = parseFloat(cashAmount);
                  if (!isFinite(gross) || gross <= 0) return null;
                  const tax = Math.round(gross * 0.05 * 100) / 100;
                  const net = Math.round((gross - tax) * 100) / 100;
                  return (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      <p>Withdrawal from your wallet: <span className="font-bold text-amber-900">₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                      <p className="mt-0.5">5% tax (3% GST + 2% CGST): <span className="font-semibold">−₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                      <p className="mt-0.5">You will receive in cash: <span className="font-bold text-amber-900">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    </div>
                  );
                })()}
              </div>
              <Button type="submit" disabled={cashLoading} className="w-full bg-[#C41E3A] text-white hover:bg-[#ad1b34]">
                {cashLoading ? "Requesting..." : "Request Cash Withdrawal"}
              </Button>
            </form>

            {/* Existing cash withdrawal requests */}
            <div className="space-y-2 mt-2">
              {cashWithdrawalsLoading && <p className="text-xs text-zinc-500">Loading requests...</p>}
              {cashWithdrawals.map((cw) => (
                <div key={cw._id} className={`rounded-xl border p-3 space-y-2 text-sm ${
                  cw.status === 'CANCELLED' ? 'border-red-500/20 bg-red-500/5' :
                  cw.status === 'DELIVERED' ? 'border-emerald-500/20 bg-emerald-500/5' :
                  cw.status === 'SCHEDULED' ? 'border-blue-500/20 bg-blue-500/5' :
                  'border-[#E8E8E8] bg-[#F8F9FA]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-[#111827]">₹{cw.amount.toLocaleString('en-IN')}</span>
                      {cw.grossAmount && cw.grossAmount !== cw.amount && (
                        <span className="ml-2 text-[11px] text-zinc-500">(₹{cw.grossAmount.toLocaleString('en-IN')} debited)</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      cw.status === 'CANCELLED' ? 'bg-red-500/20 text-red-300' :
                      cw.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-300' :
                      cw.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-600/40 text-gray-300'
                    }`}>{cw.status}</span>
                    </div>

                  {cw.status === 'SCHEDULED' && (
                    <div className="space-y-1 text-xs text-zinc-600">
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
                      className="w-full border-red-300 text-red-700 hover:bg-red-50 text-xs"
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
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-zinc-600">
                Amount (INR)
              </label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Max withdrawal: ₹${Math.floor(maxWithdrawable).toLocaleString('en-IN')}`}
                className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                required
                min="1"
                step="1"
              />
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs">
                <span className="font-bold text-emerald-700">
                  Max withdrawal: ₹{Math.floor(maxWithdrawable).toLocaleString('en-IN')} (you receive ₹{maxNetReceivable.toLocaleString('en-IN')} after 5% tax)
                </span>
                <button
                  type="button"
                  onClick={() => handleAmountChange({ target: { value: String(Math.floor(maxWithdrawable)) } } as React.ChangeEvent<HTMLInputElement>)}
                  className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                >
                  Use Max
                </button>
              </div>
              {bindingLimit === "daily" && typeof dailyWithdrawalLimit === "number" && (
                <p className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">
                  Daily limit: ₹{Math.floor(dailyWithdrawalLimit).toLocaleString('en-IN')} in any 24-hour window. You can request the remaining ₹{Math.floor(Math.max(0, dailyWithdrawalLimit - maxWithdrawable)).toLocaleString('en-IN')} after 24 hours.
                </p>
              )}
              {withdrawalType === "upi" && parseFloat(amount) > 500 && (
                <p className="text-red-400 text-sm mt-2">UPI withdrawal amount cannot exceed ₹500.</p>
              )}
              {(() => {
                // Gross-input model: entered amount = wallet debit. Tax 5% deducted from it. Net = 95%.
                const gross = parseFloat(amount);
                if (!isFinite(gross) || gross <= 0) return null;
                const tax = Math.round(gross * 0.05 * 100) / 100;
                const net = Math.round((gross - tax) * 100) / 100;
                return (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    <p>Withdrawal from your wallet: <span className="font-bold text-amber-900">₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    <p className="mt-0.5">5% tax (3% GST + 2% CGST): <span className="font-semibold">−₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                    <p className="mt-0.5">You will receive: <span className="font-bold text-amber-900">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  </div>
                );
              })()}
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            {withdrawalType === "upi" && (
              <div>
                <label htmlFor="upiId" className="mb-2 block text-sm font-medium text-zinc-600">
                  UPI ID
                </label>
                <Input
                  id="upiId"
                  name="upiId"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@oksbi"
                  className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                  required
                />
              </div>
            )}

            {withdrawalType === "bank" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="holderName" className="mb-2 block text-sm font-medium text-zinc-600">
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
                    className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                  />
                </div>
                <div>
                  <label htmlFor="accountNumber" className="mb-2 block text-sm font-medium text-zinc-600">
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
                    className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                  />
                </div>
                <div>
                  <label htmlFor="ifscCode" className="mb-2 block text-sm font-medium text-zinc-600">
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
                    className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                  />
                </div>
                <div>
                  <label htmlFor="bankName" className="mb-2 block text-sm font-medium text-zinc-600">
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
                    className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                  />
                </div>
              </div>
            )}

            <div className="mt-auto pt-4">
              <Button type="submit" className="w-full bg-[#C41E3A] text-white hover:bg-[#ad1b34]">
                Proceed to Verification
              </Button>
            </div>
          </form>
        )}

        {withdrawalType !== "cash" && step === 2 && (
          <form onSubmit={handleWithdrawalRequest} className="flex flex-col gap-4 flex-1">
            <div className="space-y-3 rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-500">Verification</p>
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
                className={`grid gap-2 rounded-lg border border-[#E8E8E8] bg-white p-1 ${
                  faceApproved ? "sm:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                {faceApproved && (
                  <button
                    type="button"
                    onClick={() => setVerificationMethod("face")}
                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                      verificationMethod === "face"
                        ? "bg-[#C41E3A] text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
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
                        ? "bg-[#C41E3A] text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
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
                      ? "bg-[#C41E3A] text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
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
                  <label htmlFor="withdrawal-password" className="mb-1 block text-sm font-medium text-zinc-600">
                    Enter Password
                  </label>
                  <Input
                    id="withdrawal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                    required
                  />
                </div>
              ) : verificationMethod === "otp" ? (
                <div className="space-y-2">
                  <label htmlFor="withdrawal-otp" className="mb-1 block text-sm font-medium text-zinc-600">
                    Enter OTP
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="withdrawal-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full rounded-md border border-[#E8E8E8] bg-white px-4 py-2 text-[#111827]"
                      required
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="sm:w-48 border-[#E8E8E8] text-[#111827] hover:bg-zinc-100"
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
              <Button type="submit" disabled={isLoading} className="w-full bg-[#C41E3A] text-white hover:bg-[#ad1b34]">
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
