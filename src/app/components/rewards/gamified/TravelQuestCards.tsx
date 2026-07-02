"use client";

import { ChevronRight } from "lucide-react";
import type { RewardQuest } from "./types";
import { completedKeysCount, STATUS_LABELS } from "./quest-ui";
import { QUEST_ICONS } from "./quest-icons";
import { CARD, getQuestAccent, SectionLabel, statusTone, StatusPill } from "./rewards-ui";

type TravelQuestCardsProps = {
  quests: RewardQuest[];
  onSelect: (quest: RewardQuest) => void;
};

export default function TravelQuestCards({ quests, onSelect }: TravelQuestCardsProps) {
  if (!quests.length) return null;

  return (
    <section>
      <SectionLabel>Trip rewards</SectionLabel>
      <p className="mt-1 text-sm text-[#64748B]">Europe and cruise programs</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quests.map((quest) => {
          const Icon = QUEST_ICONS[quest.icon];
          const accent = getQuestAccent(quest);
          const keysDone = completedKeysCount(quest);

          return (
            <button
              key={quest.id}
              type="button"
              onClick={() => onSelect(quest)}
              className={`${CARD} overflow-hidden text-left transition hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)]`}
            >
              <div className="flex items-start gap-3 border-b border-[#F1F5F9] p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.iconBg}`}>
                  <Icon className={`h-5 w-5 ${accent.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-black text-[#0F172A]">{quest.title}</h3>
                    <StatusPill label={STATUS_LABELS[quest.status]} tone={statusTone(quest.status)} />
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">{quest.rewardDescription}</p>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs font-semibold text-[#64748B]">
                  {keysDone}/{quest.keys.length} steps
                  <span className="mx-1.5 text-[#CBD5E1]">·</span>
                  {quest.window.daysLeft}d left
                  <span className="mx-1.5 text-[#CBD5E1]">·</span>
                  <span className="font-bold text-[#0F172A]">{quest.overallProgressPct}%</span>
                </p>
                <p className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-[#C41E3A]">
                  {quest.primaryBlocker}
                  <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
