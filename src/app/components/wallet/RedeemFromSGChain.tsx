"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redeemFromSGChain } from "@/actions/user";
import { toast } from "sonner";
import { ArrowDownLeft } from "lucide-react";
import Confetti from "react-confetti";

interface RedeemFromSGChainProps {
  onSuccess: () => void;
  className?: string;
}

const RedeemFromSGChain = ({ onSuccess, className }: RedeemFromSGChainProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a transfer code.");
      return;
    }

    setLoading(true);
    try {
      const result = await redeemFromSGChain(code);
      if (result.error) {
        toast.error(result.error);
      } else {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        toast.success(`Successfully deposited $${result.creditedAmountUsd.toFixed(2)}!`);
        setCode("");
        onSuccess(); // This will trigger the data refresh in the parent
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`bg-gray-900/40 border-gray-800 relative overflow-hidden flex flex-col ${className ?? ''}`}>
      {showConfetti && <Confetti />}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <ArrowDownLeft />
            Redeem from SGChain
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-gray-400 mb-4">
          Enter a transfer code from SGChain to instantly credit your Sagenex wallet.
        </p>
        <form onSubmit={handleRedeem} className="mt-auto space-y-4">
          <div>
            <label htmlFor="sgchain-code" className="sr-only">
              Transfer Code
            </label>
            <Input
              id="sgchain-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., SGX-USD-F272C2"
              className="bg-gray-800 border-gray-700 text-white font-mono"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Redeeming..." : "Redeem Code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RedeemFromSGChain;
