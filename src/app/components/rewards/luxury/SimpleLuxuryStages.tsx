"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { CheckCircle2, ChevronDown, Lock, MapPin } from "lucide-react";
import {
  TIER_META,
  TIER_ORDER,
  clampPct,
  lakh,
  type StageStatus,
  type TierId,
  type TierProgress,
} from "./tier-meta";

const STATUS_COPY: Record<StageStatus, { label: string; tone: string }> = {
  cleared: { label: "Completed", tone: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  current: { label: "You are here", tone: "bg-[#FFF1F4] text-[#C41E3A] border-[#F9C5D0]" },
  ahead: { label: "Next", tone: "bg-slate-50 text-slate-600 border-slate-200" },
  review: { label: "Under review", tone: "bg-blue-50 text-blue-800 border-blue-200" },
  claimed: { label: "Claimed", tone: "bg-amber-50 text-amber-900 border-amber-200" },
  window_closed: { label: "Time ended", tone: "bg-slate-50 text-slate-600 border-slate-200" },
};

type Props = {
  byTier: Partial<Record<TierId, TierProgress>>;
  currentTierId: TierId;
  selectedTierId: TierId;
  onSelect: (id: TierId) => void;
  resolveStatus: (id: TierId) => StageStatus;
  snapTeam: number;
  snapDirect: number;
  snapLegs: number;
  missions: ReactNode;
};

export default function SimpleLuxuryStages({
  byTier,
  currentTierId,
  selectedTierId,
  onSelect,
  resolveStatus,
  snapTeam,
  snapDirect,
  snapLegs,
  missions,
}: Props) {
  const currentMeta = TIER_META[currentTierId];
  const currentProgress = byTier[currentTierId];
  const overall = clampPct(
    ((currentProgress?.teamBizPct ?? 0) +
      (currentProgress?.directBizPct ?? 0) +
      (currentProgress?.legsPct ?? 0)) /
      3,
  );

  return (
    <div className="space-y-4">
      {/* Plain English summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-slate-500">Where you stand</p>
        <h2 className="mt-1 text-xl font-black text-[#0F172A] sm:text-2xl">
          Stage {currentMeta.stage}: {currentMeta.label} ({currentTierId})
        </h2>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          Reward for this stage: <span className="font-bold text-[#0F172A]">{currentMeta.prizes}</span>
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
            <span className="text-slate-600">Overall progress on this stage</span>
            <span className="text-[#C41E3A]">{overall}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#C41E3A] transition-all"
              style={{ width: `${overall}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <SummaryTile
            label="Team business"
            value={lakh(snapTeam)}
            target={`Need ${lakh(currentMeta.teamBiz)}`}
            ok={(currentProgress?.teamBizPct ?? 0) >= 100}
          />
          <SummaryTile
            label="Direct business"
            value={lakh(snapDirect)}
            target={`Need ${lakh(currentMeta.directBiz)}`}
            ok={(currentProgress?.directBizPct ?? 0) >= 100}
          />
          <SummaryTile
            label="Active legs"
            value={`${snapLegs}`}
            target={`Need at least ${currentMeta.legs}`}
            ok={(currentProgress?.legsPct ?? 0) >= 100}
          />
        </div>
      </section>

      {/* Simple stage list */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <p className="mb-3 px-1 text-sm font-bold text-slate-500">All 4 reward stages</p>
        <div className="space-y-2">
          {TIER_ORDER.map((id) => {
            const meta = TIER_META[id];
            const status = resolveStatus(id);
            const chip = STATUS_COPY[status];
            const cleared = status === "cleared" || status === "claimed";
            const current = id === currentTierId;
            const selected = id === selectedTierId;
            const progress = byTier[id];
            const pct = clampPct(
              ((progress?.teamBizPct ?? 0) +
                (progress?.directBizPct ?? 0) +
                (progress?.legsPct ?? 0)) /
                3,
            );

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition sm:gap-4 sm:p-4 ${
                  selected
                    ? "border-[#C41E3A] bg-[#FFF8F9] ring-2 ring-[#C41E3A]/20"
                    : current
                      ? "border-[#F9C5D0] bg-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-100 sm:h-16 sm:w-16"
                  style={{ backgroundColor: meta.accentSoft }}
                >
                  <Image
                    src={meta.image}
                    alt=""
                    fill
                    className={`object-contain p-1.5 ${status === "ahead" ? "opacity-50 grayscale" : ""}`}
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-black text-[#0F172A] sm:text-lg">
                      Stage {meta.stage}: {id} {meta.label}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${chip.tone}`}
                    >
                      {current && <MapPin className="h-3 w-3" />}
                      {cleared && <CheckCircle2 className="h-3 w-3" />}
                      {status === "ahead" && <Lock className="h-3 w-3" />}
                      {chip.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">{meta.prizes}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Target: {lakh(meta.teamBiz)} team · {lakh(meta.directBiz)} direct · {meta.legs}{" "}
                    legs · {meta.windowDays} days
                  </p>
                  {!cleared && status !== "ahead" && (
                    <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#C41E3A]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-400 transition ${
                    selected ? "rotate-180 text-[#C41E3A]" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Detail for selected stage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-black text-[#0F172A]">
          What you need for Stage {TIER_META[selectedTierId].stage}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Complete all three items below to finish this stage.
        </p>
        <div className="mt-4">{missions}</div>
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  target,
  ok,
}: {
  label: string;
  value: string;
  target: string;
  ok: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        ok ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black ${ok ? "text-emerald-700" : "text-[#0F172A]"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-500">{target}</p>
    </div>
  );
}
