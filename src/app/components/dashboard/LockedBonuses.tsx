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
    current: number;
    required: number;
  };
}

interface LockedBonusesProps {
  bonuses: Bonus[];
}

const LockedBonuses = ({ bonuses }: LockedBonusesProps) => {
  if (!bonuses || bonuses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locked Bonuses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bonuses.map((bonus) => {
          const progressPct = (bonus.progress.current / bonus.progress.required) * 100;
          return (
            <div key={bonus.level}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {bonus.isUnlocked ? (
                    <Unlock className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2 text-red-400" />
                  )}
                  <span className="font-semibold">{bonus.name}</span>
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
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${progressPct > 100 ? 100 : progressPct}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {bonus.progress.current} / {bonus.progress.required}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default LockedBonuses;
