"use client";

import { AlertCircle, CheckCircle, ChevronRight, ListTodo } from "lucide-react";
import type { TodayMission } from "./types";
import { CARD, PrimaryButton, SectionLabel } from "./rewards-ui";

type TodayMissionsProps = {
  missions: TodayMission[];
};

export default function TodayMissions({ missions }: TodayMissionsProps) {
  if (!missions.length) {
    return (
      <section className={`${CARD} flex items-center gap-3 p-4`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF1F4]">
          <CheckCircle className="h-5 w-5 text-[#C41E3A]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#0F172A]">All caught up</p>
          <p className="text-xs text-[#64748B]">No urgent tasks right now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <div className="flex items-center gap-2">
        <ListTodo className="h-4 w-4 text-[#C41E3A]" />
        <SectionLabel className="!text-[#0F172A] normal-case tracking-normal">
          Today — do this ({missions.length})
        </SectionLabel>
      </div>

      <ul className="mt-3 space-y-2">
        {missions.map((mission, i) => (
          <li
            key={mission.id}
            className={`flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between ${
              mission.priority === "urgent" ? "border-[#F4B4C4] bg-[#FFFBFC]" : "border-[#F1F5F9] bg-[#FAFBFC]"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {mission.priority === "urgent" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C41E3A]" />
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[10px] font-bold text-[#475569]">
                  {i + 1}
                </span>
              )}
              <p className="text-sm font-medium text-[#0F172A]">{mission.text}</p>
            </div>
            {mission.href ? (
              <PrimaryButton href={mission.href} className="shrink-0 self-start text-xs sm:self-center">
                {mission.actionLabel}
                <ChevronRight className="h-3.5 w-3.5" />
              </PrimaryButton>
            ) : mission.onAction ? (
              <button
                type="button"
                onClick={mission.onAction}
                className="inline-flex shrink-0 items-center rounded-lg bg-[#C41E3A] px-3.5 py-2 text-xs font-bold text-white"
              >
                {mission.actionLabel}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
