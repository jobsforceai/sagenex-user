"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { getSlabConfig, enrollFromWallet, getWalletBalance } from "@/actions/sgnxgold";

interface Slab {
  amountInr: number;
  amountUsd: number;
}

interface SlabConfig {
  slabs: Slab[];
  exchangeRate: number;
  totalMonths: number;
  goldBonusMultiplier: number;
  cashBonusMultiplier: number;
}

interface EnrollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type PlanType = "gold" | "cash";

function fmtINR(v: number) { return "₹" + v.toLocaleString("en-IN"); }
function fmtUSD(v: number) { return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function EnrollModal({ open, onOpenChange, onSuccess }: EnrollModalProps) {
  const [config, setConfig] = useState<SlabConfig | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [selectedSlab, setSelectedSlab] = useState<Slab | null>(null);
  const [planType, setPlanType] = useState<PlanType>("gold");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedSlab(null);

    Promise.allSettled([getSlabConfig(), getWalletBalance()]).then(([slabRes, balRes]) => {
      if (slabRes.status === "fulfilled" && !slabRes.value?.error) {
        setConfig(slabRes.value);
      }
      if (balRes.status === "fulfilled") {
        setWalletBalance(balRes.value.availableBalance ?? 0);
      }
      setLoading(false);
    });
  }, [open]);

  const handleEnroll = async () => {
    if (!selectedSlab) { toast.error("Please select an investment slab."); return; }
    if (selectedSlab.amountUsd > walletBalance) { toast.error("Insufficient wallet balance."); return; }

    setSubmitting(true);
    try {
      const result = await enrollFromWallet({
        amountUsd: selectedSlab.amountUsd,
        planType,
        referralCode: referralCode.trim() || undefined,
      });
      if (result?.error) { toast.error(result.error); }
      else { toast.success("Enrollment successful!"); onSuccess(); }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setSubmitting(false); }
  };

  const bonusLabel = config && selectedSlab
    ? planType === "gold"
      ? `${config.goldBonusMultiplier}x gold bonus = ${fmtUSD(selectedSlab.amountUsd * config.goldBonusMultiplier)}`
      : `${config.cashBonusMultiplier}x cash bonus = ${fmtUSD(selectedSlab.amountUsd * config.cashBonusMultiplier)}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#3c4256] bg-[#1B1F2D] text-[#ECEFF8] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-[#ECEFF8]">New SGNX Gold Investment</DialogTitle>
          <DialogDescription className="text-[#8B92AA]">
            Choose a plan, pick a slab, and start your 11-month investment.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#D7AF35]" />
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Wallet Balance */}
            <div className="flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-[#252A3A]/90 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Sagenex Wallet</span>
              <span className="text-lg font-extrabold text-emerald-300">{fmtUSD(walletBalance)}</span>
            </div>

            {/* Plan Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Plan Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlanType("gold")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    planType === "gold"
                      ? "border-[#D7AF35]/50 bg-[#D7AF35]/10"
                      : "border-[#3c4256] bg-[#252A3A] hover:border-[#D7AF35]/30"
                  }`}
                >
                  <p className={`text-sm font-extrabold ${planType === "gold" ? "text-[#F8DF8A]" : "text-[#ECEFF8]"}`}>Gold Plan</p>
                  <p className="text-xs text-[#8B92AA] mt-0.5">{config ? `${config.goldBonusMultiplier}x gold bonus` : ""}</p>
                </button>
                <button
                  onClick={() => setPlanType("cash")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    planType === "cash"
                      ? "border-[#8a77c8]/50 bg-[#8a77c8]/10"
                      : "border-[#3c4256] bg-[#252A3A] hover:border-[#8a77c8]/30"
                  }`}
                >
                  <p className={`text-sm font-extrabold ${planType === "cash" ? "text-[#c8b8f0]" : "text-[#ECEFF8]"}`}>Cash Plan</p>
                  <p className="text-xs text-[#8B92AA] mt-0.5">{config ? `${config.cashBonusMultiplier}x cash bonus` : ""}</p>
                </button>
              </div>
            </div>

            {/* Slab Picker */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Monthly Investment</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {config?.slabs.map((slab) => {
                  const isSelected = selectedSlab?.amountInr === slab.amountInr;
                  const canAfford = walletBalance >= slab.amountUsd;
                  return (
                    <button
                      key={slab.amountInr}
                      onClick={() => canAfford && setSelectedSlab(slab)}
                      disabled={!canAfford}
                      className={`relative rounded-xl border px-3 py-3 text-center transition-all ${
                        isSelected
                          ? "border-[#D7AF35]/60 bg-[#D7AF35]/12 ring-1 ring-[#D7AF35]/30"
                          : canAfford
                            ? "border-[#3c4256] bg-[#252A3A] hover:border-[#D7AF35]/30"
                            : "border-[#3c4256] bg-[#252A3A]/50 opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-[#D7AF35]" />
                      )}
                      <p className="text-sm font-extrabold text-[#ECEFF8]">{fmtINR(slab.amountInr)}</p>
                      <p className="text-[11px] text-[#8B92AA]">{fmtUSD(slab.amountUsd)}/mo</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bonus Preview */}
            {selectedSlab && (
              <div className="rounded-xl border border-[#D7AF35]/25 bg-[#D7AF35]/8 px-4 py-3 text-sm font-semibold text-[#F8DF8A]">
                {bonusLabel} &bull; {config?.totalMonths} months
              </div>
            )}

            {/* Referral Code */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">
                Referral Code <span className="text-[#3c4256]">(optional)</span>
              </p>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter sponsor's referral code"
                className="w-full rounded-xl border border-[#3c4256] bg-[#252A3A] px-4 py-2.5 text-sm text-[#ECEFF8] placeholder:text-[#4a5068] outline-none focus:border-[#D7AF35]/40 transition"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleEnroll}
              disabled={!selectedSlab || submitting}
              className="w-full rounded-xl bg-[#D7AF35] px-5 py-3 text-sm font-extrabold text-[#171B27] transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </span>
              ) : (
                `Invest ${selectedSlab ? fmtINR(selectedSlab.amountInr) : ""}/month`
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
