"use client";

import { BonusSummary } from "@/app/components/wallet/BonusSummary";

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
}

export const RewardsTab = ({ bonuses, loading }: RewardsTabProps) => {
  return (
    <div className="space-y-6 mt-6">
      <BonusSummary bonuses={bonuses} loading={loading} />
    </div>
  );
};
