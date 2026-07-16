"use client";

import LuxuryRoadPath from "@/app/components/rewards/luxury/LuxuryRoadPath";
import LuxuryTierRulesPanel from "@/app/components/rewards/LuxuryTierRulesPanel";

export default function RewardsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 pb-28 sm:px-5 sm:py-7 lg:px-6">
      <LuxuryRoadPath />
      <LuxuryTierRulesPanel defaultOpen={false} />
    </div>
  );
}
