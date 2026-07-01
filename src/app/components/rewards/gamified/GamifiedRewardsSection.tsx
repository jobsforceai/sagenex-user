"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getRewardQuests } from "@/actions/reward-quests";
import AppLoadingScreen from "@/app/components/auth/AppLoadingScreen";
import AppErrorState from "@/app/components/auth/AppErrorState";
import { Button } from "@/components/ui/button";
import ActiveQuestHero from "./ActiveQuestHero";
import QuestDetailSheet from "./QuestDetailSheet";
import RewardJourneyGrid from "./RewardJourneyGrid";
import RewardsHeader from "./RewardsHeader";
import TodayMissions from "./TodayMissions";
import TravelQuestCards from "./TravelQuestCards";
import {
  buildMissionsFromQuests,
  enrichQuests,
  getActiveQuest,
  getLuxuryQuests,
  getTravelQuests,
} from "./enrich-quests";
import type { RewardQuest } from "./types";
import { completedKeysCount } from "./quest-ui";

type GamifiedRewardsSectionProps = {
  dateLabel?: string;
  stats?: {
    yourSales?: string;
    teamSales?: string;
    activeLegs?: number;
  };
};

export default function GamifiedRewardsSection({ dateLabel, stats }: GamifiedRewardsSectionProps) {
  const [quests, setQuests] = useState<RewardQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<RewardQuest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getRewardQuests();
    if ("error" in res) {
      setError(res.error);
      setQuests([]);
    } else {
      setQuests(enrichQuests(res));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeQuest = useMemo(() => getActiveQuest(quests), [quests]);
  const luxuryQuests = useMemo(() => getLuxuryQuests(quests), [quests]);
  const travelQuests = useMemo(() => getTravelQuests(quests), [quests]);
  const missions = useMemo(() => buildMissionsFromQuests(quests), [quests]);

  const totalKeys = quests.reduce((sum, q) => sum + q.keys.length, 0);
  const keysUnlocked = quests.reduce((sum, q) => sum + completedKeysCount(q), 0);

  const yourSales = stats?.yourSales ?? "—";
  const teamSales = stats?.teamSales ?? "—";
  const activeLegs = stats?.activeLegs ?? 0;
  const today =
    dateLabel ??
    new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  if (loading) {
    return <AppLoadingScreen message="Loading your rewards…" fullScreen={false} />;
  }

  if (error) {
    return (
      <AppErrorState
        title="Could not load rewards"
        message={error}
        actions={
          <Button
            type="button"
            onClick={load}
            className="rounded-xl bg-[#C41E3A] font-bold text-white hover:bg-[#a81831]"
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (!quests.length) {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-10 text-center">
        <p className="font-display text-lg font-black text-[#0F172A]">No rewards yet</p>
        <p className="mt-2 text-sm text-[#64748B]">Build sales and team volume to unlock rewards.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <RewardsHeader
        dateLabel={today}
        yourSales={yourSales}
        teamSales={teamSales}
        activeLegs={activeLegs}
        keysUnlocked={keysUnlocked}
        totalKeys={totalKeys}
      />

      <TodayMissions missions={missions} />

      {activeQuest && (
        <ActiveQuestHero quest={activeQuest} onViewAllKeys={() => setSelectedQuest(activeQuest)} />
      )}

      {luxuryQuests.length > 0 && (
        <RewardJourneyGrid
          quests={luxuryQuests}
          selectedId={selectedQuest?.id}
          onSelect={setSelectedQuest}
        />
      )}

      {travelQuests.length > 0 && (
        <TravelQuestCards quests={travelQuests} onSelect={setSelectedQuest} />
      )}

      <QuestDetailSheet quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
    </div>
  );
}
