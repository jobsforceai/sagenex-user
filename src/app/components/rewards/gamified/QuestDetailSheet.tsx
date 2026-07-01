"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronRight, X } from "lucide-react";
import type { RewardQuest } from "./types";
import { completedKeysCount, formatWindowDate, QuestKeyRow } from "./quest-ui";
import { QUEST_ICONS } from "./quest-icons";
import {
  getQuestAccent,
  PrimaryButton,
  statusTone,
  StatusPill,
} from "./rewards-ui";
import { STATUS_LABELS } from "./quest-ui";

type QuestDetailSheetProps = {
  quest: RewardQuest | null;
  onClose: () => void;
};

function resolvePrimaryCta(quest: RewardQuest) {
  const incompleteKey = quest.keys.find((k) => k.status === "in_progress" && k.cta);
  if (quest.status === "claimable") {
    return { label: "Claim reward", href: "#reward-claims" };
  }
  if (quest.status === "pending_review") {
    return { label: "View claim status", href: "#reward-claims" };
  }
  if (incompleteKey?.cta) return incompleteKey.cta;
  return null;
}

export default function QuestDetailSheet({ quest, onClose }: QuestDetailSheetProps) {
  useEffect(() => {
    if (!quest) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [quest, onClose]);

  const Icon = quest ? QUEST_ICONS[quest.icon] : null;
  const accent = quest ? getQuestAccent(quest) : null;
  const keysDone = quest ? completedKeysCount(quest) : 0;
  const keysTotal = quest?.keys.length ?? 0;
  const primaryCta = quest ? resolvePrimaryCta(quest) : null;
  const firstIncomplete = quest
    ? quest.keys.findIndex((k) => k.status !== "complete" && k.status !== "locked")
    : -1;

  return (
    <AnimatePresence>
      {quest && Icon && accent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
          <motion.button
            type="button"
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Close dialog"
          />

          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quest-detail-title"
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.18)] lg:max-h-[88dvh] lg:rounded-2xl lg:shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 shrink-0 bg-gradient-to-r from-[#9d122f] via-[#C41E3A] to-[#E85D75]" />

            <div className="flex shrink-0 justify-center pt-2.5 lg:hidden">
              <div className="h-1 w-10 rounded-full bg-[#E2E8F0]" aria-hidden />
            </div>

            <header className="shrink-0 border-b border-[#F1F5F9] px-5 pb-4 pt-3 sm:px-6">
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accent.iconBg}`}>
                  <Icon className={`h-6 w-6 ${accent.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C41E3A]">
                    {quest.subtitle}
                  </p>
                  <h2
                    id="quest-detail-title"
                    className="font-display text-xl font-black leading-tight text-[#0F172A] sm:text-2xl"
                  >
                    {quest.title}
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-[#64748B]">{quest.rewardDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8FAFC] text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill label={STATUS_LABELS[quest.status]} tone={statusTone(quest.status)} />
                <span className="inline-flex items-center rounded-lg bg-[#FFF1F4] px-2.5 py-1 text-xs font-bold text-[#C41E3A]">
                  {quest.overallProgressPct}% · {keysDone}/{keysTotal} requirements
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#475569] ring-1 ring-[#E2E8F0]">
                  <CalendarDays className="h-3.5 w-3.5 text-[#94A3B8]" />
                  {formatWindowDate(quest.window.startsAt)} – {formatWindowDate(quest.window.endsAt)}
                </span>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <div className="rounded-2xl border border-[#F4B4C4]/60 bg-[#FFF5F7] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C41E3A]">
                  What you still need
                </p>
                <p className="mt-2 text-base font-bold leading-snug text-[#0F172A]">{quest.primaryBlocker}</p>
                <p className="mt-2 text-sm text-[#64748B]">{quest.nextAction}</p>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                    All requirements
                  </p>
                  <span className="text-xs font-semibold text-[#94A3B8]">
                    {keysDone}/{keysTotal} done
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {quest.keys.map((key, i) => (
                    <QuestKeyRow
                      key={key.id}
                      questKey={key}
                      index={i}
                      total={quest.keys.length}
                      isActiveKey={i === firstIncomplete}
                      animationDelay={0.03 * i}
                    />
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-center text-xs text-[#94A3B8]">
                {quest.window.label}
                <span className="mx-1.5 text-[#CBD5E1]">·</span>
                {quest.window.daysLeft} days remaining
                {quest.window.expired && (
                  <span className="mt-1 block font-bold text-[#C41E3A]">This window has expired</span>
                )}
              </p>
            </div>

            {primaryCta && (
              <footer className="shrink-0 border-t border-[#F1F5F9] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                <PrimaryButton href={primaryCta.href} className="w-full justify-center py-3.5 text-base">
                  {primaryCta.label}
                  <ChevronRight className="h-4 w-4" />
                </PrimaryButton>
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
