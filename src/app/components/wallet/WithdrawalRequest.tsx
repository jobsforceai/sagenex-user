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

const WithdrawalRequest = ({ currentBalance, kycStatus }: WithdrawalRequestProps) => {
  const [amount, setAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
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
    
    if (!withdrawalAddress) {
        setError("Please set your USDT (TRC20) withdrawal address in your profile.");
        setIsLoading(false);
        return;
    }

    try {
      const result = await requestWithdrawal(withdrawalAmount, withdrawalAddress);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(result.message);
        setAmount(""); // Clear amount on success
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Available: $${currentBalance.toFixed(2)}`}
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
              required
              min="0.01"
              step="0.01"
            />
          </div>
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
