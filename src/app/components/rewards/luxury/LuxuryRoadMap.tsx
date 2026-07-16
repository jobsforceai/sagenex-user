"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle2, Lock, MapPin } from "lucide-react";
import {
  TIER_META,
  TIER_ORDER,
  clampPct,
  lakh,
  type StageStatus,
  type TierId,
  type TierProgress,
} from "./tier-meta";

/**
 * Gold disc centers on luxury-road-pro-v2.png.
 * Journey starts at TOP (10L) and ends at BOTTOM (1CR).
 */
const CHECKPOINTS: Record<TierId, { left: number; top: number; scale: number }> = {
  "10L": { left: 77.4, top: 10.3, scale: 0.88 },
  "30L": { left: 46.2, top: 29.2, scale: 0.94 },
  "50L": { left: 69.1, top: 47.7, scale: 1.0 },
  "1CR": { left: 55.1, top: 81.7, scale: 1.08 },
};

/** Keep cards from spilling off the screen on narrow viewports. */
function clampedLeft(left: number, isMobile: boolean) {
  if (!isMobile) return left;
  return Math.min(78, Math.max(22, left));
}

type RoadMapProps = {
  byTier: Partial<Record<TierId, TierProgress>>;
  currentTierId: TierId;
  selectedTierId: TierId;
  onSelect: (id: TierId) => void;
  resolveStatus: (id: TierId) => StageStatus;
  snapTeam: number;
  snapDirect: number;
  snapLegs: number;
};

function MiniBar({
  label,
  have,
  need,
  pct,
  done,
}: {
  label: string;
  have: string;
  need: string;
  pct: number;
  done: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[9px] font-bold sm:text-[10px]">
        <span className="text-slate-500">{label}</span>
        <span className={done ? "text-emerald-600" : "text-[#0F172A]"}>
          {have} <span className="text-slate-300">/</span> {need}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-[#C41E3A]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LuxuryRoadMap({
  byTier,
  currentTierId,
  selectedTierId,
  onSelect,
  resolveStatus,
  snapTeam,
  snapDirect,
  snapLegs,
}: RoadMapProps) {
  const [hoveredId, setHoveredId] = useState<TierId | null>(null);
  /** Detail panel pinned by tap/click — not always open for current (avoids mobile overlap). */
  const [detailId, setDetailId] = useState<TierId | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const openDetail = (id: TierId) => {
    onSelect(id);
    setDetailId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[#F3F0EB] shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3 rounded-t-[28px] border-b border-slate-200/60 bg-white/80 px-3 py-3 backdrop-blur sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Luxury Path
          </p>
          <h2 className="text-base font-black tracking-tight text-[#0F172A] sm:text-xl">
            Reward Road
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[#C41E3A]/20 bg-[#FFF1F4] px-2.5 py-1 text-[10px] font-black text-[#C41E3A] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px]">
          <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Stage {TIER_META[currentTierId].stage} · {currentTierId}
        </div>
      </div>

      <div className="relative w-full overflow-visible px-1 pb-8 pt-14 sm:pb-10 sm:pt-20">
        <div className="relative aspect-[2/3] w-full overflow-visible">
          <Image
            src="/rewards/luxury-road-pro-v2.png"
            alt="Luxury Reward Road"
            fill
            priority
            className="object-contain object-center"
            sizes="100vw"
          />

          <div className="absolute inset-0 overflow-visible">
            {TIER_ORDER.map((id) => {
              const pos = CHECKPOINTS[id];
              const meta = TIER_META[id];
              const status = resolveStatus(id);
              const cleared = status === "cleared" || status === "claimed";
              const current = id === currentTierId;
              const selected = id === selectedTierId;
              const showDetail =
                detailId === id || (!isMobile && hoveredId === id);
              const progress = byTier[id];
              const teamPct = clampPct(progress?.teamBizPct);
              const directPct = clampPct(progress?.directBizPct);
              const legsPct = clampPct(progress?.legsPct);
              const overall = clampPct((teamPct + directPct + legsPct) / 3);
              const teamDone = teamPct >= 100 || (progress?.missing?.teamBizINR ?? 0) <= 0;
              const directDone =
                directPct >= 100 || (progress?.missing?.directBizINR ?? 0) <= 0;
              const legsDone = legsPct >= 100 || (progress?.missing?.legs ?? 0) <= 0;

              const baseW = isMobile ? 128 : 200;
              const cardW = Math.round(baseW * pos.scale);
              const left = clampedLeft(pos.left, isMobile);
              const accent =
                current
                  ? "#C41E3A"
                  : cleared
                    ? "#059669"
                    : status === "ahead"
                      ? "#94A3B8"
                      : meta.accent;

              return (
                <div
                  key={id}
                  className={`absolute ${showDetail || current ? "z-30" : "z-20"}`}
                  style={{ left: `${left}%`, top: `${pos.top}%` }}
                >
                  <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center">
                    <div
                      className={current && !isMobile ? "luxury-road-current-card" : current ? "scale-105" : ""}
                      style={current && isMobile ? { transformOrigin: "center bottom" } : undefined}
                      onMouseEnter={() => {
                        if (!isMobile) setHoveredId(id);
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) setHoveredId((h) => (h === id ? null : h));
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openDetail(id)}
                        className="group relative text-left outline-none"
                        aria-label={`Stage ${meta.stage} ${meta.label}`}
                        aria-expanded={showDetail}
                        style={{ width: cardW }}
                      >
                        {current && (
                          <div className="absolute -top-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full bg-[#0F172A] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-lg sm:-top-3 sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[9px]">
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            You are here
                          </div>
                        )}

                        <div
                          className={`overflow-hidden rounded-xl border bg-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition duration-200 sm:rounded-2xl sm:shadow-[0_18px_40px_rgba(15,23,42,0.2)] ${
                            selected || current
                              ? "border-[#C41E3A] ring-2 ring-[#C41E3A]/30"
                              : cleared
                                ? "border-emerald-300"
                                : "border-slate-200/90"
                          } ${status === "ahead" && !showDetail ? "opacity-85" : ""}`}
                        >
                          <div
                            className="relative h-16 w-full sm:h-28 md:h-32"
                            style={{ backgroundColor: meta.accentSoft }}
                          >
                            <Image
                              src={meta.image}
                              alt=""
                              fill
                              className={`object-contain p-1.5 sm:p-2.5 ${
                                status === "ahead" && !showDetail
                                  ? "opacity-55 grayscale"
                                  : ""
                              }`}
                              sizes="(max-width: 640px) 140px, 240px"
                            />
                            <span
                              className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white sm:left-2.5 sm:top-2.5 sm:px-2.5 sm:text-[10px]"
                              style={{ backgroundColor: accent }}
                            >
                              Stage {meta.stage}
                            </span>
                            <span
                              className="absolute bottom-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow sm:bottom-2.5 sm:right-2.5 sm:h-7 sm:min-w-7 sm:px-1.5 sm:text-[11px]"
                              style={{ backgroundColor: accent }}
                            >
                              {cleared ? (
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : status === "ahead" ? (
                                <Lock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                              ) : (
                                `${overall}%`
                              )}
                            </span>
                          </div>

                          <div className="px-2 py-1.5 sm:px-3 sm:py-2.5">
                            <p className="text-[11px] font-black text-[#0F172A] sm:text-sm">
                              {id} · {meta.label}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[9px] font-semibold text-slate-500 sm:text-[11px]">
                              {meta.prizes}
                            </p>
                          </div>

                          <div
                            className={`grid transition-all duration-200 ease-out ${
                              showDetail
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="space-y-2 border-t border-slate-100 bg-slate-50/95 px-2.5 py-2.5 sm:space-y-2.5 sm:px-3 sm:py-3">
                                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
                                  {current
                                    ? "Your progress here"
                                    : cleared
                                      ? "Stage cleared"
                                      : "Requirements"}
                                </p>
                                <MiniBar
                                  label="Team business"
                                  have={lakh(snapTeam)}
                                  need={lakh(meta.teamBiz)}
                                  pct={teamPct}
                                  done={teamDone}
                                />
                                <MiniBar
                                  label="Direct business"
                                  have={lakh(snapDirect)}
                                  need={lakh(meta.directBiz)}
                                  pct={directPct}
                                  done={directDone}
                                />
                                <MiniBar
                                  label="Active legs"
                                  have={`${snapLegs}`}
                                  need={`Min ${meta.legs}`}
                                  pct={legsPct}
                                  done={legsDone}
                                />
                                {(progress?.missing?.teamBizINR ?? 0) > 0 && current && (
                                  <p className="text-[9px] font-semibold leading-snug text-[#C41E3A] sm:text-[10px]">
                                    Still need {lakh(progress?.missing?.teamBizINR)} team
                                    {(progress?.missing?.directBizINR ?? 0) > 0
                                      ? ` · ${lakh(progress?.missing?.directBizINR)} direct`
                                      : ""}
                                    {(progress?.missing?.legs ?? 0) > 0
                                      ? ` · ${progress?.missing?.legs} more legs`
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mx-auto flex flex-col items-center">
                          <div
                            className="h-3 w-0.5 sm:h-4"
                            style={{ backgroundColor: accent }}
                          />
                          <div
                            className="h-2.5 w-2.5 rounded-full ring-2 ring-white sm:h-3 sm:w-3 sm:ring-[3px]"
                            style={{ backgroundColor: accent }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/50 bg-white/70 px-3 py-2.5 text-[10px] font-bold text-slate-500 sm:gap-3 sm:px-4 sm:py-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
          {isMobile ? "Tap a card for progress details" : "Hover or tap a card for full progress"}
        </span>
      </div>
    </section>
  );
}
