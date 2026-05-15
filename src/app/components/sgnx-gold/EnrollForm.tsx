"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enrollFromWallet, getLiveGoldRate } from "@/actions/sgnxgold";
import { toast } from "sonner";
import { Loader2, Gem, DollarSign, Sparkles, TrendingUp } from "lucide-react";

interface EnrollFormProps {
  userId: string;
  onSuccess: () => void;
}

interface GoldRate {
  pricePerGram: number;
  pricePerGramBeforeGst: number;
  gstPercent: number;
  pricePerGramUsd: number;
  exchangeRate: number;
  source: string;
  timestamp: string;
}

const formatINR = (v: number) =>
  v.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export default function EnrollForm({ userId, onSuccess }: EnrollFormProps) {
  const [targetUserId, setTargetUserId] = useState(userId);
  const [amountUsd, setAmountUsd] = useState<string>("");
  const [planType, setPlanType] = useState<"gold" | "cash">("gold");
  const [submitting, setSubmitting] = useState(false);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    async function fetchRate() {
      setLoadingRate(true);
      try {
        const result = await getLiveGoldRate();
        if (result && !result.error) {
          setGoldRate(result);
        }
      } catch {
        // Gold rate is optional for preview
      } finally {
        setLoadingRate(false);
      }
    }
    fetchRate();
  }, []);

  const amount = parseFloat(amountUsd) || 0;
  const maturityMonths = 11;
  const totalDeposited = amount * maturityMonths;

  // Preview calculations
  const isGold = planType === "gold";
  const bonusMultiplier = isGold ? 3 : 4;
  const bonusAmount = amount * bonusMultiplier;
  const maturityValue = totalDeposited + bonusAmount;

  // Gold-specific preview
  const goldGramsPerMonth =
    isGold && goldRate && amount > 0 ? amount / goldRate.pricePerGram : 0;
  const totalGoldGrams = goldGramsPerMonth * maturityMonths;
  const bonusGoldGrams =
    isGold && goldRate && amount > 0 ? bonusAmount / goldRate.pricePerGram : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetUserId.trim()) {
      toast.error("User ID is required.");
      return;
    }
    if (amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await enrollFromWallet({
        userId: targetUserId.trim(),
        amountUsd: amount,
        planType,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Enrollment created successfully!");
      setAmountUsd("");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enrollment Form */}
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Gem className="h-5 w-5 text-amber-400" />
            New SGNX Gold Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-300">
                User ID
              </Label>
              <Input
                id="userId"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Pre-filled with your ID. Change to enroll another user.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">
                Monthly Amount (INR)
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="e.g. 10000"
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planType" className="text-gray-300">
                Plan Type
              </Label>
              <Select
                value={planType}
                onValueChange={(v) => setPlanType(v as "gold" | "cash")}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="gold">Gold Plan</SelectItem>
                  <SelectItem value="cash">Cash Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live Gold Rate */}
            {isGold && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <div className="text-amber-300 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Live Gold Rate:{" "}
                    {loadingRate ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : goldRate ? (
                      <span className="font-semibold">
                        {formatINR(goldRate.pricePerGram)}/gram
                      </span>
                    ) : (
                      "Unavailable"
                    )}
                  </div>
                  {goldRate && (
                    <p className="text-xs text-amber-400/60">
                      Exchange rate: 1 USD = {goldRate.exchangeRate.toFixed(2)} INR
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || amount <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enrolling...
                </>
              ) : (
                "Enroll Now"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {amount > 0 && (
        <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Enrollment Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PreviewRow
                icon={<DollarSign className="h-4 w-4 text-blue-400" />}
                label="Monthly Payment"
                value={formatINR(amount)}
              />
              <PreviewRow
                icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
                label={`Total Over ${maturityMonths} Months`}
                value={formatINR(totalDeposited)}
              />
              <PreviewRow
                icon={<Sparkles className="h-4 w-4 text-purple-400" />}
                label={`Bonus (${bonusMultiplier}x)`}
                value={formatINR(bonusAmount)}
              />
              <PreviewRow
                icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
                label="Maturity Value"
                value={formatINR(maturityValue)}
              />
              {isGold && goldRate && (
                <>
                  <PreviewRow
                    icon={<Gem className="h-4 w-4 text-amber-400" />}
                    label="Gold / Month"
                    value={`${goldGramsPerMonth.toFixed(4)} g`}
                  />
                  <PreviewRow
                    icon={<Gem className="h-4 w-4 text-amber-400" />}
                    label="Total Gold"
                    value={`${totalGoldGrams.toFixed(4)} g`}
                  />
                  <PreviewRow
                    icon={<Sparkles className="h-4 w-4 text-amber-300" />}
                    label="Bonus Gold (3x)"
                    value={`${bonusGoldGrams.toFixed(4)} g`}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/40 px-4 py-3">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
