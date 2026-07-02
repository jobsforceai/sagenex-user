import type { ReactNode } from "react";
import type { RewardQuest } from "./types";
import { REWARDS } from "./rewards-theme";

/** Tier accent — left border + soft icon background (always readable on white) */
export type QuestAccent = {
  border: string;
  iconBg: string;
  iconColor: string;
};

export const QUEST_ACCENTS: Record<string, QuestAccent> = {
  "10L": { border: "border-l-[#C41E3A]", iconBg: "bg-[#FFF1F4]", iconColor: "text-[#C41E3A]" },
  "30L": { border: "border-l-[#9d122f]", iconBg: "bg-[#FFF1F4]", iconColor: "text-[#9d122f]" },
  "50L": { border: "border-l-[#0F172A]", iconBg: "bg-[#F1F5F9]", iconColor: "text-[#0F172A]" },
  "1CR": { border: "border-l-[#D97706]", iconBg: "bg-[#FFFBEB]", iconColor: "text-[#B45309]" },
  "europe-trip-2026": { border: "border-l-[#0369A1]", iconBg: "bg-[#F0F9FF]", iconColor: "text-[#0369A1]" },
  "cruise-trip-2026": { border: "border-l-[#0369A1]", iconBg: "bg-[#F0F9FF]", iconColor: "text-[#0369A1]" },
};

const DEFAULT_LUXURY: QuestAccent = {
  border: "border-l-[#C41E3A]",
  iconBg: "bg-[#FFF1F4]",
  iconColor: "text-[#C41E3A]",
};

const DEFAULT_TRAVEL: QuestAccent = {
  border: "border-l-[#0369A1]",
  iconBg: "bg-[#F0F9FF]",
  iconColor: "text-[#0369A1]",
};

export function getQuestAccent(quest: Pick<RewardQuest, "id" | "type">): QuestAccent {
  return QUEST_ACCENTS[quest.id] ?? (quest.type === "luxury" ? DEFAULT_LUXURY : DEFAULT_TRAVEL);
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B] ${className}`}>
      {children}
    </p>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: keyof typeof PILL_TONES }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${PILL_TONES[tone]}`}>
      {label}
    </span>
  );
}

const PILL_TONES = {
  locked: "bg-[#F1F5F9] text-[#64748B]",
  progress: "bg-[#FFF1F4] text-[#C41E3A]",
  review: "bg-[#F0F9FF] text-[#0369A1]",
  success: "bg-[#FFF1F4] text-[#C41E3A]",
  urgent: "bg-[#FEF3C7] text-[#92400E]",
} as const;

export function statusTone(status: RewardQuest["status"]): keyof typeof PILL_TONES {
  switch (status) {
    case "locked":
      return "locked";
    case "in_progress":
      return "progress";
    case "pending_review":
      return "review";
    case "claimable":
    case "claimed":
      return "success";
    default:
      return "locked";
  }
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#C41E3A] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(196,30,58,0.22)] transition hover:bg-[#a81831] ${className}`}
    >
      {children}
    </a>
  );
}

export const CARD =
  "rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.05)]";

export { REWARDS };
