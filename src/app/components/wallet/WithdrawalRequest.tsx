"use client";

import { useState, useEffect } from "react";
import { requestWithdrawal, getProfileData } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle } from "lucide-react";

interface WithdrawalRequestProps {
  currentBalance: number;
  kycStatus: string | undefined;
}

type WithdrawalType = "crypto" | "upi" | "bank";

const WithdrawalRequest = ({ currentBalance, kycStatus }: WithdrawalRequestProps) => {
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
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const profileData = await getProfileData();
      if (profileData && !profileData.error && profileData.usdtTrc20Address) {
        setWithdrawalAddress(profileData.usdtTrc20Address);
      }
    };
    fetchProfile();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    // Clear previous submission errors when user starts typing
    setError(null);
    setMessage(null);

    const withdrawalAmount = parseFloat(newAmount);
    if (!isNaN(withdrawalAmount) && withdrawalAmount > currentBalance) {
      setError("Withdrawal amount cannot exceed your available balance.");
    }
  };

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError("Please enter a valid amount.");
      setIsLoading(false);
      return;
    }

    if (withdrawalAmount > currentBalance) {
      setError("Withdrawal amount cannot exceed your available balance.");
      setIsLoading(false);
      return;
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
        }
    } = { amount: withdrawalAmount };

    if (withdrawalType === "crypto") {
      if (!withdrawalAddress) {
        setError("Please set your USDT (TRC20) withdrawal address in your profile or enter it manually.");
        setIsLoading(false);
        return;
      }
      payload.withdrawalAddress = withdrawalAddress;
    } else if (withdrawalType === "upi") {
      if (!upiId) {
        setError("Please enter your UPI ID.");
        setIsLoading(false);
        return;
      }
      payload.upiId = upiId;
    } else if (withdrawalType === "bank") {
        if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.holderName) {
            setError("Please fill in all bank details.");
            setIsLoading(false);
            return;
        }
        payload.bankDetails = bankDetails;
    }

    try {
      const result = await requestWithdrawal(payload);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(result.message);
        setAmount(""); // Clear amount on success
        setUpiId("");
        setBankDetails({ bankName: "", accountNumber: "", ifscCode: "", holderName: "" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (kycStatus !== 'VERIFIED') {
    return (
        <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Request Withdrawal
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3 bg-yellow-900/50 text-yellow-300 p-4 rounded-md">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">Your KYC must be verified before you can make a withdrawal.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Request Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 border-b border-gray-700">
            <Button variant={withdrawalType === 'crypto' ? 'secondary' : 'ghost'} onClick={() => setWithdrawalType('crypto')}>Crypto</Button>
            <Button variant={withdrawalType === 'upi' ? 'secondary' : 'ghost'} onClick={() => setWithdrawalType('upi')}>UPI</Button>
            <Button variant={withdrawalType === 'bank' ? 'secondary' : 'ghost'} onClick={() => setWithdrawalType('bank')}>Bank</Button>
        </div>
        <form onSubmit={handleWithdrawalRequest} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-2">
              Amount (USD)
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder={`Available: $${currentBalance.toFixed(2)}`}
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
              required
              min="0.01"
              step="0.01"
            />
          </div>
          
          {withdrawalType === 'crypto' && (
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

          {withdrawalType === 'upi' && (
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

          {withdrawalType === 'bank' && (
            <div className="space-y-4">
                <div>
                    <label htmlFor="holderName" className="block text-sm font-medium text-gray-400 mb-2">
                        Account Holder Name
                    </label>
                    <Input id="holderName" name="holderName" type="text" value={bankDetails.holderName} onChange={handleBankDetailsChange} placeholder="John Doe" required 
                        className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                    />
                </div>
                <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-400 mb-2">
                        Account Number
                    </label>
                    <Input id="accountNumber" name="accountNumber" type="text" value={bankDetails.accountNumber} onChange={handleBankDetailsChange} placeholder="1234567890" required 
                        className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                    />
                </div>
                <div>
                    <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-400 mb-2">
                        IFSC Code
                    </label>
                    <Input id="ifscCode" name="ifscCode" type="text" value={bankDetails.ifscCode} onChange={handleBankDetailsChange} placeholder="SBIN0001234" required 
                        className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                    />
                </div>
                <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-400 mb-2">
                        Bank Name
                    </label>
                    <Input id="bankName" name="bankName" type="text" value={bankDetails.bankName} onChange={handleBankDetailsChange} placeholder="State Bank of India" required 
                        className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                    />
                </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Submitting Request..." : "Request Withdrawal"}
          </Button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          {message && <p className="text-green-400 text-sm mt-2">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
};

export default WithdrawalRequest;