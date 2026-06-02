"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Disabled by team directive 2026-06-01 — SGChain ↔ Sagenex money transfers
// are temporarily hidden from the UI. Uncomment the two imports + the JSX
// block below in this file to restore.
// import TransferToSGChain from "@/app/components/wallet/TransferToSGChain";
// import RedeemFromSGChain from "@/app/components/wallet/RedeemFromSGChain";
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
    buttonClass: "border-amber-300 text-amber-700 hover:bg-amber-50",
  },
  {
    label: "Freelancer",
    planType: "FREELANCER" as const,
    amountUsd: 60,
    buttonClass: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
  },
];

const couponErrorMessages: Record<string, string> = {
  PLAN_REQUIRED: "Please select a plan to continue.",
  INSUFFICIENT_USD_BALANCE: "Insufficient wallet balance to create this coupon.",
  CODE_EXPIRED: "This coupon code has expired.",
  CODE_ALREADY_CLAIMED: "This coupon has already been claimed.",
  PLAN_MISMATCH: "The selected plan does not match this coupon.",
  INVALID_CODE: "Invalid coupon code.",
};

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

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

  // currentBalance / onSuccess are still threaded through this component for
  // when the SGChain transfer panels are re-enabled. Reference them once so
  // TypeScript doesn't flag them as unused while the block below is commented.
  void currentBalance; void onSuccess;

  return (
    <div className="space-y-6 mt-6">
      {/*
        Disabled by team directive 2026-06-01 — SGChain ↔ Sagenex money transfers
        are temporarily hidden from the UI. Uncomment this block (and the two
        imports at the top of this file) to restore.

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TransferToSGChain currentBalance={currentBalance} className="h-full" />
          <RedeemFromSGChain onSuccess={onSuccess} className="h-full" />
        </div>
      */}

      {/* SGBN Coupons */}
      <Card className="rounded-2xl border border-[#E8E8E8] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-[#111827]">SGBN Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-500">
            Create a coupon for SGBN plans. Coupons are valid for 10 minutes.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SGBN_PLANS.map((plan) => (
              <Button
                key={plan.planType}
                type="button"
                variant="outline"
                className={`border-[#E8E8E8] ${plan.buttonClass} ${
                  selectedPlan === plan.planType ? "bg-zinc-50" : ""
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
            <div className="space-y-3 rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-3 text-sm text-zinc-600">
              <p>Generate a {selectedPlan} coupon? It will be valid for 10 minutes.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="bg-[#C41E3A] text-white hover:bg-[#ad1b34]"
                  onClick={() => handleCreateCoupon(selectedPlan)}
                  disabled={couponLoading !== null}
                >
                  {couponLoading === selectedPlan ? "Creating..." : "Generate Coupon"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#E8E8E8] text-[#111827] hover:bg-zinc-50"
                  onClick={() => setSelectedPlan(null)}
                  disabled={couponLoading !== null}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {couponError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {couponError}
            </div>
          )}
          {couponMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {couponMessage}
            </div>
          )}

          {coupon && (
            <div className="space-y-3 rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-zinc-400">
                    Coupon Code
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-[#111827]">
                    {coupon.code}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#E8E8E8] text-[#111827] hover:bg-zinc-100"
                  onClick={handleCopyCode}
                >
                  Copy
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-600">
                <div>
                  <p className="text-xs text-zinc-400">Plan</p>
                  <p className="font-semibold text-[#111827]">{coupon.planType}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Amount</p>
                  <p className="font-semibold text-[#111827]">{formatCurrency(coupon.amountUsd)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Status</p>
                  <p className="font-semibold text-[#111827]">{isCouponExpired ? "EXPIRED" : coupon.status}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Expires In</p>
                  <p className="font-semibold text-[#111827]">{timeRemaining || "—"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
