"use client";

import { Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Bonus {
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

interface LockedBonusesProps {
  bonuses: Bonus[];
}

const LockedBonuses = ({ bonuses }: LockedBonusesProps) => {
  if (!bonuses || bonuses.length === 0) {
    return null;
  }

  const lockedBonuses = bonuses.filter((bonus) => !bonus.isUnlocked);

  if (lockedBonuses.length === 0) {
    return null;
  }

  const getProgressPct = (current: number, required: number) =>
    required > 0 ? Math.min(100, (current / required) * 100) : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locked Bonuses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lockedBonuses.map((bonus) => {
          const progressItems = [
            bonus.progress?.activeLegs && {
              label: bonus.progress.activeLegs.depth
                ? `Active legs (depth ${bonus.progress.activeLegs.depth})`
                : "Active legs",
              current: bonus.progress.activeLegs.current,
              required: bonus.progress.activeLegs.required,
            },
            bonus.progress?.activeTeam && {
              label: "Active team",
              current: bonus.progress.activeTeam.current,
              required: bonus.progress.activeTeam.required,
            },
            bonus.progress?.testQualified && {
              label: "Tests qualified",
              current: bonus.progress.testQualified.current,
              required: bonus.progress.testQualified.required,
            },
          ].filter(
            (item): item is { label: string; current: number; required: number } => Boolean(item)
          );
          const imageLevel = bonus.level + 1;
          const displayName = bonus.name?.trim()
            ? `${bonus.name} - Level ${imageLevel}`
            : `Matrix Level ${imageLevel}`;
          return (
            <div key={bonus.level}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {bonus.isUnlocked ? (
                    <Unlock className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2 text-red-400" />
                  )}
                  <span className="font-semibold">{displayName}</span>
                </div>
                <span className="font-bold text-lg">
                  {bonus.lockedAmount.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{bonus.unlockRequirement}</p>
                {progressItems.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {progressItems.map((item) => (
                      <div key={item.label}>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div
                            className="bg-green-500 h-2.5 rounded-full"
                            style={{ width: `${getProgressPct(item.current, item.required)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1">
                          {item.label}: {item.current} / {item.required}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs mt-2">Progress data unavailable.</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LockedBonuses;
