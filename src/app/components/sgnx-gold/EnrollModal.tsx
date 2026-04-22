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
      <DialogContent className="border-[#E8E8E8] bg-white text-[#111827] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-[#111827]">New SGNX Gold Investment</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Choose a plan, pick a slab, and start your 11-month investment.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#C41E3A]" />
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Wallet Balance */}
            <div className="flex items-center justify-between rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Sagenex Wallet</span>
              <span className="text-lg font-extrabold text-[#111827]">{fmtUSD(walletBalance)}</span>
            </div>

            {/* Plan Type */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Plan Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlanType("gold")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    planType === "gold"
                      ? "border-[#D7AF35]/40 bg-[#F8F9FA]"
                      : "border-[#E8E8E8] bg-white hover:border-[#D7AF35]/30"
                  }`}
                >
                  <p className={`text-sm font-extrabold ${planType === "gold" ? "text-[#111827]" : "text-[#111827]"}`}>Gold Plan</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{config ? `${config.goldBonusMultiplier}x gold bonus` : ""}</p>
                </button>
                <button
                  onClick={() => setPlanType("cash")}
                  className={`rounded-2xl border p-4 text-left transition ${
                    planType === "cash"
                      ? "border-[#E8E8E8] bg-[#F8F9FA]"
                      : "border-[#E8E8E8] bg-white hover:border-[#E8E8E8]"
                  }`}
                >
                  <p className={`text-sm font-extrabold ${planType === "cash" ? "text-[#111827]" : "text-[#111827]"}`}>Cash Plan</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{config ? `${config.cashBonusMultiplier}x cash bonus` : ""}</p>
                </button>
              </div>
            </div>

            {/* Slab Picker */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Monthly Investment</p>
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
                          ? "border-[#D7AF35]/40 bg-[#F8F9FA] ring-1 ring-[#D7AF35]/20"
                          : canAfford
                            ? "border-[#E8E8E8] bg-white hover:border-[#D7AF35]/30"
                            : "border-[#E8E8E8] bg-[#F8F9FA] opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-[#C41E3A]" />
                      )}
                      <p className="text-sm font-extrabold text-[#111827]">{fmtINR(slab.amountInr)}</p>
                      <p className="text-[11px] text-zinc-400">{fmtUSD(slab.amountUsd)}/mo</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bonus Preview */}
            {selectedSlab && (
              <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-3 text-sm font-semibold text-[#111827]">
                {bonusLabel} &bull; {config?.totalMonths} months
              </div>
            )}

            {/* Referral Code */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Referral Code <span className="text-zinc-500">(optional)</span>
              </p>
              <input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter sponsor's referral code"
                className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder:text-zinc-400 outline-none focus:border-[#D7AF35]/40 transition"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleEnroll}
              disabled={!selectedSlab || submitting}
              className="w-full rounded-xl bg-[#C41E3A] px-5 py-3 text-sm font-extrabold text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
