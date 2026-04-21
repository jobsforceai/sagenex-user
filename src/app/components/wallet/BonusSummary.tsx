"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";

interface LockedBonus {
  level: number;
  name: string;
  lockedAmount: number;
  isUnlocked: boolean;
  unlockRequirement: string;
  progress: {
    activeLegs?: { current: number; required: number; depth?: number };
    activeTeam?: { current: number; required: number };
  };
}

interface BonusSummaryProps {
  bonuses?: LockedBonus[];
  loading: boolean;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

export const BonusSummary = ({ bonuses, loading }: BonusSummaryProps) => {
  const [showDetails, setShowDetails] = useState(false);

  // Backend levels start at 1, but UI should display starting at 2.
  const displayLevel = (level: number) => level + 1;
  // Also shift any "L<number>" tokens in names to match UI numbering.
  const displayName = (name: string) =>
    name.replace(/\bL(\d+)\b/g, (_, raw) => `L${Number(raw) + 1}`);

  const totalLocked = bonuses?.reduce((sum, b) => sum + b.lockedAmount, 0) ?? 0;
  const unlockedCount = bonuses?.filter((b) => b.isUnlocked).length ?? 0;
  const totalCount = bonuses?.length ?? 0;

  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg">Bonus Summary</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {unlockedCount} of {totalCount} levels unlocked
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="border-gray-700 text-gray-300 hover:bg-white/5"
        >
          {showDetails ? (
            <>
              Hide <ChevronUp className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Show <ChevronDown className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
            Total Locked Bonuses
          </p>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <p className="text-2xl font-bold text-white">{formatCurrency(totalLocked)}</p>
          )}
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : bonuses && bonuses.length > 0 ? (
              bonuses.map((bonus) => (
                <div
                  key={bonus.level}
                  className={`rounded-xl border p-4 ${
                    bonus.isUnlocked
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-gray-800 bg-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {bonus.isUnlocked ? (
                        <Unlock className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <p className="font-semibold text-white">
                          Level {displayLevel(bonus.level)}
                        </p>
                        <p className="text-xs text-gray-500">{displayName(bonus.name)}</p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        bonus.isUnlocked ? "text-emerald-400" : "text-gray-400"
                      }`}
                    >
                      {formatCurrency(bonus.lockedAmount)}
                    </p>
                  </div>

                  {/* Progress Bars */}
                  {!bonus.isUnlocked && (
                    <div className="space-y-2">
                      {bonus.progress.activeLegs && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Active Legs</span>
                            <span>
                              {bonus.progress.activeLegs.current} / {bonus.progress.activeLegs.required}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (bonus.progress.activeLegs.current /
                                    bonus.progress.activeLegs.required) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {bonus.progress.activeTeam && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Active Team</span>
                            <span>
                              {bonus.progress.activeTeam.current} / {bonus.progress.activeTeam.required}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (bonus.progress.activeTeam.current /
                                    bonus.progress.activeTeam.required) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {bonus.isUnlocked && (
                    <p className="text-xs text-emerald-300 mt-2">✓ Unlocked</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">No bonus data available</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
