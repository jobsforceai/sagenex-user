"use client";

import { useState } from "react";
import { createCryptoDepositInvoice } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: number;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
}

const CryptoDeposit = () => {
  const [amount, setAmount] = useState("");
  const [originalAmount, setOriginalAmount] = useState(0);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInvoice(null);

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError("Please enter a valid amount.");
      setIsLoading(false);
      return;
    }

    setOriginalAmount(depositAmount);

    try {
      const result = await createCryptoDepositInvoice(depositAmount);
      if (result.error) {
        setError(result.error);
      } else {
        setInvoice(result.invoice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressCopy = () => {
    if (invoice?.pay_address) {
      navigator.clipboard.writeText(invoice.pay_address);
      toast.success("Copied to clipboard!");
    }
  };

  const handleAmountCopy = () => {
    if (invoice?.pay_amount) {
      navigator.clipboard.writeText(invoice.pay_amount.toString());
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle>Crypto Deposit (USDT TRC20)</CardTitle>
      </CardHeader>
      <CardContent>
        {!invoice ? (
          <form onSubmit={handleCreateInvoice} className="space-y-4">
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
                placeholder="Enter amount to deposit"
                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                required
                min="0.01"
                step="0.01"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Generating Invoice..." : "Generate Deposit Address"}
            </Button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </form>
        ) : (
          <div className="text-center space-y-6">
            <h3 className="text-lg font-semibold">Complete Your Deposit</h3>
            <p className="text-muted-foreground text-sm">
              To credit your account with ${originalAmount.toFixed(2)} USD, please send the exact crypto amount to the address below.
            </p>
            
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCode value={invoice.pay_address} size={160} />
            </div>

            <div className="space-y-4 text-left">
              <div>
                <p className="font-semibold text-sm mb-1">Amount to Send</p>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-800">
                  <p className="font-mono text-sm flex-grow break-all">{invoice.pay_amount} {invoice.pay_currency.toUpperCase()}</p>
                  <Button size="sm" onClick={handleAmountCopy} variant="ghost">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-1">Send to Address</p>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-800">
                  <p className="font-mono text-sm flex-grow break-all">{invoice.pay_address}</p>
                  <Button size="sm" onClick={handleAddressCopy} variant="ghost">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-400/80 px-4">
              Note: The crypto amount includes processing fees and is calculated based on the current exchange rate. Your wallet will be credited automatically after the transaction is confirmed.
            </p>

            <Button onClick={() => setInvoice(null)} variant="outline">
              Create New Deposit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CryptoDeposit;
