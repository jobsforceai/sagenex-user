"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiateTransferToSGChain } from "@/actions/user";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-confetti";

interface TransferToSGChainProps {
  currentBalance: number;
}

const TransferToSGChain = ({ currentBalance }: TransferToSGChainProps) => {
  const [amount, setAmount] = useState("");
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const storedTransfer = localStorage.getItem("sgchainTransfer");
    if (storedTransfer) {
      const { code, expiresAt } = JSON.parse(storedTransfer);
      if (Date.now() < expiresAt) {
        setTransferCode(code);
      } else {
        localStorage.removeItem("sgchainTransfer");
      }
    }
  }, []);

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (transferAmount > currentBalance) {
      toast.error("Insufficient funds.");
      return;
    }

    setLoading(true);
    setTransferCode(null);
    localStorage.removeItem("sgchainTransfer");

    try {
      const result = await initiateTransferToSGChain(transferAmount);
      if (result.error) {
        toast.error(result.error);
      } else if (result.transferCode) {
        setTransferCode(result.transferCode);
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now
        localStorage.setItem("sgchainTransfer", JSON.stringify({ code: result.transferCode, expiresAt }));
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (transferCode) {
      navigator.clipboard.writeText(transferCode);
      toast.success("Transfer code copied to clipboard!");
    }
  };

  const handleReset = () => {
    setTransferCode(null);
    setAmount("");
    localStorage.removeItem("sgchainTransfer");
  };

  return (
    <Card className="bg-gray-900/40 border-gray-800 relative overflow-hidden">
      {showConfetti && <Confetti />}
      <CardHeader>
        <CardTitle>Transfer to SGChain</CardTitle>
      </CardHeader>
      <CardContent>
        {!transferCode ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
                Amount to Transfer
              </label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available Balance: ${currentBalance.toFixed(2)}
              </p>
            </div>
            <Button onClick={handleTransfer} disabled={loading} className="w-full">
              {loading ? "Generating Code..." : "Get Transfer Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-gray-300">Your transfer code is ready. It is valid for 5 minutes.</p>
            <div className="p-4 bg-gray-800 rounded-lg flex items-center justify-center space-x-2">
              <p className="text-lg font-mono text-amber-400 break-all">{transferCode}</p>
              <Button onClick={copyToClipboard} size="icon" variant="ghost">
                <Copy className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              Copy this code and go to the SGChain website to complete your transfer.
            </p>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Generate New Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransferToSGChain;
