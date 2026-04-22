"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, RefreshCw, TrendingUp, Wallet, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getUserLP, depositToLP, transferLPToUser, withdrawFromLP } from "@/actions/user";
import { sendTransferOtp } from "@/actions/user";

interface LPPool {
  availableBalance: number;
  deployedBalance: number;
  totalDeposited: number;
  totalEarned: number;
}

interface LPTransaction {
  _id: string;
  type: string;
  amount: number;
  createdAt: string;
  meta?: Record<string, unknown>;
}

interface LPData {
  pool: LPPool | null;
  transactions: LPTransaction[];
}

const formatINR = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const txLabel: Record<string, string> = {
  LP_DEPOSIT: "Deposited to LP",
  LP_WITHDRAWAL: "Withdrew from LP",
  LP_YIELD: "Yield Earned",
  LP_TRANSFER_IN: "Received LP Transfer",
  LP_TRANSFER_OUT: "Sent LP Transfer",
};

interface LPTabProps {
  availableBalance: number;
  onSuccess: () => void;
}

export const LiquidityProviderTab = ({ availableBalance, onSuccess }: LPTabProps) => {
  const [data, setData] = useState<LPData>({ pool: null, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeForm, setActiveForm] = useState<"deposit" | "transfer" | "withdraw" | null>(null);

  // Shared form state
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [credType, setCredType] = useState<"OTP" | "PASSWORD">("OTP");
  const [credValue, setCredValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getUserLP();
    if (res?.error) {
      setError(res.error);
    } else {
      setData({ pool: res.pool ?? null, transactions: res.transactions ?? [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const resetForm = () => {
    setAmount("");
    setRecipientId("");
    setCredValue("");
    setOtpSent(false);
    setOtpCooldown(0);
    setCredType("OTP");
  };

  const handleOpenForm = (form: "deposit" | "transfer" | "withdraw") => {
    resetForm();
    setActiveForm(form);
  };

  const handleSendOtp = async () => {
    const res = await sendTransferOtp();
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setOtpSent(true);
    setOtpCooldown(60);
    toast.success("OTP sent to your registered email.");
  };

  const numericAmount = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (!credValue) {
      toast.error(credType === "OTP" ? "Enter the OTP." : "Enter your password.");
      return;
    }
    if (activeForm === "deposit" && numericAmount < 100000) {
      toast.error("Minimum deposit is ₹1,00,000.");
      return;
    }
    if (activeForm === "transfer" && !recipientId.trim()) {
      toast.error("Enter a recipient User ID.");
      return;
    }

    setSubmitting(true);
    const credentials = { type: credType, value: credValue };

    let res;
    if (activeForm === "deposit") {
      res = await depositToLP(numericAmount, credentials);
    } else if (activeForm === "transfer") {
      res = await transferLPToUser(recipientId.trim(), numericAmount, credentials);
    } else {
      res = await withdrawFromLP(numericAmount, credentials);
    }

    setSubmitting(false);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    const messages: Record<string, string> = {
      deposit: "Deposited to LP pool successfully.",
      transfer: "LP transfer sent successfully.",
      withdraw: res?.earlyWithdrawalRequested
        ? "Early withdrawal request submitted. Your principal will be returned when the deployment settles."
        : "Withdrawal successful.",
    };
    toast.success(messages[activeForm!]);
    resetForm();
    setActiveForm(null);
    fetchData();
    onSuccess();
  };

  const pool = data.pool;

  return (
    <div className="space-y-6 mt-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Liquidity Provider Pool</h2>
          <p className="text-sm text-gray-400">Earn 1.9% yield per deployment cycle on your deployed amount.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-gray-900/60 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Available</p>
            <p className="text-base font-semibold text-white">
              {loading ? "—" : formatINR(pool?.availableBalance ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Deployed</p>
            <p className="text-base font-semibold text-amber-400">
              {loading ? "—" : formatINR(pool?.deployedBalance ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Deposited</p>
            <p className="text-base font-semibold text-white">
              {loading ? "—" : formatINR(pool?.totalDeposited ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 border-gray-800">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Earned</p>
            <p className="text-base font-semibold text-emerald-400">
              {loading ? "—" : formatINR(pool?.totalEarned ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          onClick={() => handleOpenForm("deposit")}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Deposit to LP
        </Button>
        <Button
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          onClick={() => handleOpenForm("transfer")}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Transfer to User
        </Button>
        <Button
          variant="outline"
          className="border-gray-700 text-gray-200 hover:bg-gray-800"
          onClick={() => handleOpenForm("withdraw")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
      </div>

      {/* Action form */}
      {activeForm && (
        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              {activeForm === "deposit" && <><Wallet className="h-4 w-4" /> Deposit to LP Pool</>}
              {activeForm === "transfer" && <><ArrowRight className="h-4 w-4" /> Transfer LP to User</>}
              {activeForm === "withdraw" && <><Lock className="h-4 w-4" /> Withdraw from LP</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeForm === "deposit" && (
              <p className="text-xs text-gray-400">
                Transfers from your available wallet balance (₹{availableBalance.toLocaleString("en-IN")}).
                Minimum ₹1,00,000. Deployed funds cannot be withdrawn until settlement (principal only, no yield).
              </p>
            )}
            {activeForm === "withdraw" && (
              <div className="rounded-lg bg-amber-900/20 border border-amber-700/40 p-3 text-xs text-amber-300">
                <strong>Note:</strong> Only your idle (available) LP balance can be withdrawn immediately.
                Deployed funds require an early withdrawal request — principal is returned, but yield is forfeited.
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Amount (INR)</Label>
              <Input
                type="number"
                placeholder={activeForm === "deposit" ? "Min ₹1,00,000" : "Enter amount"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {activeForm === "transfer" && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Recipient User ID</Label>
                <Input
                  placeholder="e.g. U1234"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            )}

            {/* Credential method */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={credType === "OTP" ? "default" : "outline"}
                  className={credType === "OTP" ? "" : "border-gray-700 text-gray-300"}
                  onClick={() => { setCredType("OTP"); setCredValue(""); }}
                >
                  OTP
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={credType === "PASSWORD" ? "default" : "outline"}
                  className={credType === "PASSWORD" ? "" : "border-gray-700 text-gray-300"}
                  onClick={() => { setCredType("PASSWORD"); setCredValue(""); setOtpSent(false); }}
                >
                  Password
                </Button>
              </div>

              {credType === "OTP" && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-gray-300 text-sm">OTP</Label>
                    <Input
                      placeholder="Enter OTP"
                      value={credValue}
                      onChange={(e) => setCredValue(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={otpCooldown > 0}
                    onClick={handleSendOtp}
                    className="border-gray-700 text-gray-300 shrink-0"
                  >
                    {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                  </Button>
                </div>
              )}

              {credType === "PASSWORD" && (
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Password</Label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={credValue}
                    onChange={(e) => setCredValue(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Processing..." : "Confirm"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300"
                onClick={() => { setActiveForm(null); resetForm(); }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction history */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-300">LP Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-gray-400 p-4">Loading...</p>
          ) : data.transactions.length === 0 ? (
            <p className="text-sm text-gray-500 p-4">No LP transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400 text-xs">Type</TableHead>
                    <TableHead className="text-gray-400 text-xs text-right">Amount</TableHead>
                    <TableHead className="text-gray-400 text-xs text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((tx) => (
                    <TableRow key={tx._id} className="border-gray-800/50 hover:bg-gray-800/30">
                      <TableCell className="py-2">
                        <Badge
                          variant="outline"
                          className={
                            tx.type === "LP_YIELD"
                              ? "border-emerald-700/50 text-emerald-400 text-xs"
                              : tx.type === "LP_WITHDRAWAL"
                              ? "border-red-700/50 text-red-400 text-xs"
                              : "border-gray-700 text-gray-300 text-xs"
                          }
                        >
                          {txLabel[tx.type] ?? tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`py-2 text-right text-sm font-medium ${
                          tx.type === "LP_WITHDRAWAL" || tx.type === "LP_TRANSFER_OUT"
                            ? "text-red-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {tx.type === "LP_WITHDRAWAL" || tx.type === "LP_TRANSFER_OUT" ? "−" : "+"}
                        {formatINR(tx.amount)}
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
