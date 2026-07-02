"use client";

import { ChevronRight } from "lucide-react";
import { HeroQuestProgress } from "./AnimatedProgress";
import type { RewardQuest } from "./types";
import { completedKeysCount, DaysLeftBadge, QuestKeyRow, STATUS_LABELS } from "./quest-ui";
import { QUEST_ICONS } from "./quest-icons";
import {
  CARD,
  getQuestAccent,
  PrimaryButton,
  SectionLabel,
  statusTone,
  StatusPill,
} from "./rewards-ui";

type ActiveQuestHeroProps = {
  quest: RewardQuest;
  onViewAllKeys?: () => void;
};

export default function ActiveQuestHero({ quest, onViewAllKeys }: ActiveQuestHeroProps) {
  const Icon = QUEST_ICONS[quest.icon];
  const accent = getQuestAccent(quest);
  const keysDone = completedKeysCount(quest);
  const keysTotal = quest.keys.length;
  const incompleteKey = quest.keys.find((k) => k.status === "in_progress" && k.cta);
  const primaryCta =
    quest.status === "claimable" || quest.status === "pending_review"
      ? { label: quest.status === "claimable" ? "Claim reward" : "View status", href: "#reward-claims" }
      : incompleteKey?.cta;

  const firstIncomplete = quest.keys.findIndex(
    (k) => k.status !== "complete" && k.status !== "locked",
  );

  return (
    <section className={`${CARD} overflow-hidden`}>
      {/* Accent top bar — brand touch without full red wall */}
      <div className="h-1 bg-gradient-to-r from-[#9d122f] via-[#C41E3A] to-[#E85D75]" />

      <div className="border-b border-[#F1F5F9] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={STATUS_LABELS[quest.status]} tone={statusTone(quest.status)} />
          <DaysLeftBadge days={quest.window.daysLeft} urgent={quest.window.daysLeft <= 14} />
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.iconBg}`}>
            <Icon className={`h-6 w-6 ${accent.iconColor}`} />
          </div>
          <div className="min-w-0">
            <SectionLabel>{quest.subtitle}</SectionLabel>
            <h2 className="font-display text-xl font-black text-[#0F172A] sm:text-2xl">{quest.title}</h2>
            <p className="mt-1 text-sm text-[#64748B]">{quest.rewardDescription}</p>
          </div>
        </div>

        <div className="mt-5">
          <HeroQuestProgress
            percent={quest.overallProgressPct}
            keysDone={keysDone}
            keysTotal={keysTotal}
          />
        </div>
      </div>

      <div className="border-b border-[#F1F5F9] bg-[#FAFBFC] px-5 py-4 sm:px-6">
        <SectionLabel>Do this next</SectionLabel>
        <p className="mt-1.5 text-base font-bold leading-snug text-[#0F172A] sm:text-lg">{quest.nextAction}</p>
        {primaryCta && (
          <PrimaryButton href={primaryCta.href} className="mt-3">
            {primaryCta.label}
            <ChevronRight className="h-4 w-4" />
          </PrimaryButton>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <SectionLabel>Requirements to unlock</SectionLabel>
          {onViewAllKeys && (
            <button
              type="button"
              onClick={onViewAllKeys}
              className="text-xs font-bold text-[#C41E3A] hover:underline"
            >
              View all
            </button>
          )}
        </div>
        <ul className="space-y-3">
          {quest.keys.map((key, i) => (
            <QuestKeyRow
              key={key.id}
              questKey={key}
              index={i}
              total={quest.keys.length}
              isActiveKey={i === firstIncomplete}
              animationDelay={0.04 * i}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
