"use client";

import { Lock } from "lucide-react";
import type { RewardQuest } from "./types";
import { completedKeysCount } from "./quest-ui";
import { QUEST_ICONS } from "./quest-icons";
import { CARD, getQuestAccent, SectionLabel, statusTone, StatusPill } from "./rewards-ui";
import { STATUS_LABELS } from "./quest-ui";

type RewardJourneyGridProps = {
  quests: RewardQuest[];
  selectedId?: string;
  onSelect: (quest: RewardQuest) => void;
  title?: string;
  subtitle?: string;
};

export default function RewardJourneyGrid({
  quests,
  selectedId,
  onSelect,
  title,
  subtitle,
}: RewardJourneyGridProps) {
  return (
    <section>
      <SectionLabel>{title ?? "Luxury levels"}</SectionLabel>
      <p className="mt-1 text-sm text-[#64748B]">{subtitle ?? "Tap a level to see requirements"}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quests.map((quest) => {
          const Icon = QUEST_ICONS[quest.icon];
          const accent = getQuestAccent(quest);
          const isCurrent = quest.isActiveQuest || quest.status === "in_progress";
          const isLocked = quest.status === "locked";
          const keysDone = completedKeysCount(quest);
          const selected = selectedId === quest.id;

          return (
            <button
              key={quest.id}
              type="button"
              onClick={() => onSelect(quest)}
              className={`${CARD} overflow-hidden text-left transition hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] ${
                selected || isCurrent ? "ring-2 ring-[#C41E3A]/25" : ""
              }`}
            >
              <div className={`border-b border-[#F1F5F9] p-3.5 ${accent.iconBg}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 ${accent.iconColor}`}>
                    {isLocked ? <Lock className="h-4 w-4 text-[#94A3B8]" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <StatusPill
                    label={isCurrent ? "Active" : STATUS_LABELS[quest.status]}
                    tone={isCurrent ? "progress" : statusTone(quest.status)}
                  />
                </div>
                <p className="mt-3 text-sm font-bold text-[#0F172A]">{quest.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#64748B]">{quest.rewardDescription}</p>
              </div>

              <div className="p-3.5">
                <p className="text-[11px] font-semibold text-[#64748B]">
                  <span>{keysDone}/{quest.keys.length} steps</span>
                  <span className="mx-1.5 text-[#CBD5E1]">·</span>
                  <span className="font-bold text-[#0F172A]">{quest.overallProgressPct}%</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
