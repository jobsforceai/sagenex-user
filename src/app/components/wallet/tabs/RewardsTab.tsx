"use client";

import { useState } from "react";
import { BonusSummary } from "@/app/components/wallet/BonusSummary";
import { generateSgGoldCode } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LockedBonus {
  level: number;
  name: string;
  lockedAmount: number;
  isUnlocked: boolean;
  unlockRequirement: string;
  progress: {
    activeLegs?: { current: number; required: number; depth?: number };
    activeTeam?: { current: number; required: number };
    testQualified?: { current: number; required: number };
  };
}

interface RewardsTabProps {
  bonuses?: LockedBonus[];
  loading: boolean;
  userId?: string;
}

export const RewardsTab = ({ bonuses, loading, userId }: RewardsTabProps) => {
  const [sggoldLoading, setSgGoldLoading] = useState(false);
  const [sggoldError, setSgGoldError] = useState<string | null>(null);
  const [sggoldCode, setSgGoldCode] = useState<string | null>(null);
  const [sggoldExpiresAt, setSgGoldExpiresAt] = useState<string | null>(null);
  const [sggoldReward, setSgGoldReward] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!userId) {
      setSgGoldError("User ID not available.");
      return;
    }
    setSgGoldError(null);
    setSgGoldLoading(true);
    try {
      const res = await generateSgGoldCode(userId);
      if (res?.error || res?.success === false) {
        setSgGoldError(res?.error || "Unable to generate code.");
        return;
      }
      setSgGoldCode(res.code || null);
      setSgGoldExpiresAt(res.expiresAt || null);
      setSgGoldReward(res.reward || null);
    } catch {
      setSgGoldError("Unable to generate code.");
    } finally {
      setSgGoldLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!sggoldCode) return;
    try {
      await navigator.clipboard.writeText(sggoldCode);
    } catch {
      // ignore clipboard errors
    }
  };

  const formatExpiry = (value?: string | null) =>
    value ? new Date(value).toLocaleString() : "N/A";

  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">SGGOLD Loyalty Reward</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Generate your eligibility code to enroll with SG Gold. Minimum package: ₹9,000.
          </p>
          {sggoldCode ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-emerald-200/80">Eligibility Code</span>
                <button
                  type="button"
                  className="text-xs text-emerald-200 underline"
                  onClick={handleCopy}
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-lg font-semibold text-emerald-200">{sggoldCode}</p>
              <p className="mt-1 text-xs text-emerald-200/70">
                Expires: {formatExpiry(sggoldExpiresAt)}
              </p>
              {sggoldReward && (
                <p className="mt-1 text-xs text-emerald-200/70">
                  Reward: {sggoldReward}
                </p>
              )}
            </div>
          ) : (
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleGenerateCode}
              disabled={sggoldLoading}
            >
              {sggoldLoading ? "Generating..." : "Generate Code"}
            </Button>
          )}
          {sggoldError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {sggoldError}
            </div>
          )}
        </CardContent>
      </Card>
      <BonusSummary bonuses={bonuses} loading={loading} />
    </div>
  );
};
