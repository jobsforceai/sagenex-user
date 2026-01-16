"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TransferToSGChain from "@/app/components/wallet/TransferToSGChain";
import RedeemFromSGChain from "@/app/components/wallet/RedeemFromSGChain";
import { createSgbnCoupon } from "@/actions/user";

interface TransferTabProps {
  currentBalance: number;
  onSuccess: () => void;
}

type SgbnCoupon = {
  transferId: string;
  code: string;
  amountSgc: number;
  amountUsd: number;
  planType: "BUSINESS" | "FREELANCER";
  status: string;
  expiresAt: string;
  createdAt: string;
};

const SGBN_PLANS = [
  {
    label: "Business",
    planType: "BUSINESS" as const,
    amountUsd: 120,
    buttonClass: "border-amber-400/50 text-amber-200 hover:bg-amber-500/10",
  },
  {
    label: "Freelancer",
    planType: "FREELANCER" as const,
    amountUsd: 60,
    buttonClass: "border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/10",
  },
];

const couponErrorMessages: Record<string, string> = {
  PLAN_REQUIRED: "Please select a plan to continue.",
  INSUFFICIENT_USD_BALANCE: "Insufficient USD balance to create this coupon.",
  CODE_EXPIRED: "This coupon code has expired.",
  CODE_ALREADY_CLAIMED: "This coupon has already been claimed.",
  PLAN_MISMATCH: "The selected plan does not match this coupon.",
  INVALID_CODE: "Invalid coupon code.",
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const TransferTab = ({ currentBalance, onSuccess }: TransferTabProps) => {
  const [coupon, setCoupon] = useState<SgbnCoupon | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"BUSINESS" | "FREELANCER" | null>(null);
  const [couponLoading, setCouponLoading] = useState<"BUSINESS" | "FREELANCER" | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isCouponExpired, setIsCouponExpired] = useState(false);

  const handleCreateCoupon = async (planType: "BUSINESS" | "FREELANCER") => {
    setCouponError(null);
    setCouponMessage(null);
    setCouponLoading(planType);
    try {
      const res = await createSgbnCoupon(planType);
      if (res?.error) {
        setCouponError(couponErrorMessages[res.error] || res.error);
        return;
      }

      const nextCoupon: SgbnCoupon | null = res?.transferId ? res : res?.coupon || null;
      if (!nextCoupon?.code) {
        setCouponError("Unable to create coupon. Please try again.");
        return;
      }
      setCoupon(nextCoupon);
      setCouponMessage("Coupon created. Use it in SGBN within 10 minutes.");
      setSelectedPlan(null);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Failed to create coupon.");
    } finally {
      setCouponLoading(null);
    }
  };

  const handleCopyCode = async () => {
    if (!coupon?.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCouponMessage("Coupon code copied.");
    } catch {
      setCouponError("Unable to copy the code. Please copy it manually.");
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TransferToSGChain currentBalance={currentBalance} className="h-full" />
        <RedeemFromSGChain onSuccess={onSuccess} className="h-full" />
      </div>

      {/* SGBN Coupons */}
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader>
          <CardTitle>SGBN Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Create a coupon for SGBN plans. Coupons are valid for 10 minutes (USD only).
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SGBN_PLANS.map((plan) => (
              <Button
                key={plan.planType}
                type="button"
                variant="outline"
                className={`border-gray-700 ${plan.buttonClass} ${
                  selectedPlan === plan.planType ? "bg-white/5" : ""
                }`}
                onClick={() => {
                  setSelectedPlan(plan.planType);
                  setCouponError(null);
                  setCouponMessage(null);
                }}
                disabled={couponLoading !== null}
              >
                {`${plan.label} ${formatCurrency(plan.amountUsd)}`}
              </Button>
            ))}
          </div>
          {selectedPlan && (
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300 space-y-3">
              <p>Generate a {selectedPlan} coupon? It will be valid for 10 minutes.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-emerald-500 text-black hover:bg-emerald-400"
                  onClick={() => handleCreateCoupon(selectedPlan)}
                  disabled={couponLoading !== null}
                >
                  {couponLoading === selectedPlan ? "Creating..." : "Generate Coupon"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-200 hover:bg-white/5"
                  onClick={() => setSelectedPlan(null)}
                  disabled={couponLoading !== null}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {couponError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {couponError}
            </div>
          )}
          {couponMessage && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {couponMessage}
            </div>
          )}

          {coupon && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                    Coupon Code
                  </p>
                  <p className="mt-2 font-mono text-sm text-emerald-200 break-all">
                    {coupon.code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/10"
                  onClick={handleCopyCode}
                >
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p>{coupon.planType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p>{formatCurrency(coupon.amountUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p>{isCouponExpired ? "EXPIRED" : coupon.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expires In</p>
                  <p>{timeRemaining || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
