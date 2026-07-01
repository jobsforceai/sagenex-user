"use client";

import { CheckCircle2, Lock } from "lucide-react";
import { AnimatedProgressBar } from "./AnimatedProgress";
import type { RewardQuest } from "./types";
import { completedKeysCount } from "./quest-ui";
import { QUEST_ICONS } from "./quest-icons";
import {
  CARD,
  getQuestAccent,
  SectionLabel,
  statusTone,
  StatusPill,
} from "./rewards-ui";
import { STATUS_LABELS } from "./quest-ui";

type RewardMapProps = {
  quests: RewardQuest[];
  selectedId?: string;
  onSelect: (quest: RewardQuest) => void;
  title?: string;
  subtitle?: string;
};

function MapNode({
  quest,
  isSelected,
  isLast,
  index,
  onSelect,
}: {
  quest: RewardQuest;
  isSelected: boolean;
  isLast: boolean;
  index: number;
  onSelect: () => void;
}) {
  const Icon = QUEST_ICONS[quest.icon];
  const accent = getQuestAccent(quest);
  const isComplete = quest.status === "claimed" || quest.status === "claimable";
  const isCurrent = quest.isActiveQuest || quest.status === "in_progress";
  const keysDone = completedKeysCount(quest);

  return (
    <div className="flex shrink-0 items-center">
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-[130px] flex-col items-center rounded-xl p-3 text-center transition sm:w-[140px] ${
          isSelected ? "bg-[#FFF1F4] ring-2 ring-[#C41E3A]/20" : "hover:bg-[#F8FAFC]"
        }`}
      >
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-xl border-2 ${
            isComplete
              ? "border-[#6EE7B7] bg-[#ECFDF5] text-[#047857]"
              : isCurrent
                ? "border-[#C41E3A] bg-[#FFF1F4] text-[#C41E3A]"
                : quest.status === "locked"
                  ? "border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1]"
                  : "border-[#E2E8F0] bg-white text-[#64748B]"
          }`}
        >
          {isComplete ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : quest.status === "locked" ? (
            <Lock className="h-5 w-5" />
          ) : (
            <Icon className={`h-5 w-5 ${isCurrent ? accent.iconColor : ""}`} />
          )}
        </div>

        <p className="mt-3 text-xs font-bold text-[#0F172A] sm:text-sm">{quest.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#64748B]">{quest.rewardDescription}</p>

        <div className="mt-3 w-full">
          <AnimatedProgressBar
            value={quest.overallProgressPct}
            variant={isComplete ? "emerald" : "crimson"}
            size="xs"
            delay={0.1 + index * 0.06}
          />
          <p className="mt-1.5 text-[10px] font-semibold text-[#64748B]">
            {keysDone}/{quest.keys.length} steps · {quest.overallProgressPct}%
          </p>
        </div>

        <StatusPill
          label={isCurrent ? "Active" : STATUS_LABELS[quest.status]}
          tone={isCurrent ? "progress" : statusTone(quest.status)}
        />
      </button>

      {!isLast && (
        <div className="mx-1 flex h-14 w-8 items-center sm:w-10">
          <div className={`h-0.5 w-full rounded-full ${isComplete ? "bg-[#00b386]" : "bg-[#E2E8F0]"}`} />
        </div>
      )}
    </div>
  );
}

export default function RewardMap({ quests, selectedId, onSelect, title, subtitle }: RewardMapProps) {
  return (
    <section className={`${CARD} p-5 sm:p-6`}>
      <SectionLabel>{title ?? "Reward levels"}</SectionLabel>
      <p className="mt-1 text-sm text-[#64748B]">
        {subtitle ?? "Tap a level to see full requirements"}
      </p>

      <div className="-mx-1 mt-5 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max items-start px-1">
          {quests.map((quest, index) => (
            <MapNode
              key={quest.id}
              quest={quest}
              index={index}
              isSelected={selectedId === quest.id}
              isLast={index === quests.length - 1}
              onSelect={() => onSelect(quest)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
