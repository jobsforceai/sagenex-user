"use client";

import {
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
} from "lucide-react";
import { PrimaryButton } from "./rewards-ui";
import type { QuestKey, RewardQuest } from "./types";

export const STATUS_LABELS: Record<RewardQuest["status"], string> = {
  locked: "Locked",
  in_progress: "In progress",
  pending_review: "Waiting for review",
  claimable: "Ready to claim",
  claimed: "Unlocked",
};

export function formatWindowDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function completedKeysCount(quest: RewardQuest) {
  return quest.keys.filter((k) => k.status === "complete").length;
}

export function QuestKeyRow({
  questKey,
  index,
  total,
  showCta = true,
  isActiveKey = false,
  animationDelay = 0,
}: {
  questKey: QuestKey;
  index: number;
  total: number;
  showCta?: boolean;
  isActiveKey?: boolean;
  animationDelay?: number;
}) {
  const done = questKey.status === "complete";
  const locked = questKey.status === "locked";

  return (
    <li
      className={`rounded-xl border p-4 ${
        done
          ? "border-[#F4B4C4] bg-[#FFF8FA]"
          : locked
            ? "border-[#E2E8F0] bg-[#F8FAFC]"
            : isActiveKey
              ? "border-[#F4B4C4] bg-[#FFFBFC]"
              : "border-[#E2E8F0] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            done
              ? "bg-[#FFF1F4] text-[#C41E3A]"
              : locked
                ? "bg-[#F1F5F9] text-[#94A3B8]"
                : "bg-[#FFF1F4] text-[#C41E3A]"
          }`}
        >
          {done ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : locked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#94A3B8]">
              Step {index + 1} of {total}
            </span>
            {done && (
              <span className="rounded-md bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold text-[#C41E3A]">
                Complete
              </span>
            )}
            {isActiveKey && !done && !locked && (
              <span className="rounded-md bg-[#C41E3A] px-2 py-0.5 text-[10px] font-bold text-white">
                Current step
              </span>
            )}
          </div>

          <p className="mt-1 text-sm font-bold text-[#0F172A]">{questKey.label}</p>

          <p className="mt-0.5 text-sm text-[#334155]">
            <span className="font-semibold text-[#0F172A]">{questKey.currentDisplay}</span>
            <span className="mx-1.5 text-[#CBD5E1]">of</span>
            <span>{questKey.requiredDisplay}</span>
            {!done && !locked && (
              <span className="ml-2 text-xs font-semibold text-[#94A3B8]">{questKey.progressPct}%</span>
            )}
          </p>

          {!done && questKey.remainingDisplay !== "Done" && (
            <p className={`mt-1 text-xs font-semibold ${locked ? "text-[#94A3B8]" : "text-[#C41E3A]"}`}>
              {questKey.remainingDisplay}
            </p>
          )}

          {questKey.helpText && (
            <p className="mt-2 text-xs leading-relaxed text-[#64748B]">{questKey.helpText}</p>
          )}

          {showCta && !done && questKey.cta && !locked && (
            <PrimaryButton href={questKey.cta.href} className="mt-3 text-xs">
              {questKey.cta.label}
            </PrimaryButton>
          )}
        </div>
      </div>
    </li>
  );
}

export function DaysLeftBadge({ days, urgent }: { days: number; urgent?: boolean }) {
  const isUrgent = urgent ?? days <= 7;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
        isUrgent ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#F1F5F9] text-[#475569]"
      }`}
    >
      <Clock className="h-3.5 w-3.5" />
      {days} days left
    </span>
  );
}

// Re-export icons for map/cards
export { QUEST_ICONS } from "./quest-icons";
