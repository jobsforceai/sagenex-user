"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { getLuxuryProgress } from "@/actions/luxury-rewards";
import {
  TIER_META,
  TIER_ORDER,
  resolveStageStatus,
  type LuxuryCycle,
  type TierId,
  type TierProgress,
} from "@/app/components/rewards/luxury/tier-meta";

const STATUS_LINE: Record<string, string> = {
  review: "Under review",
  claimed: "Claimed",
  cleared: "Completed",
  current: "In progress",
  ahead: "Up next",
  window_closed: "Window closed",
};

/** Minimal dashboard teaser — one stage, one image. Detail lives on /rewards */
export default function LuxuryPathSection() {
  const [loading, setLoading] = useState(true);
  const [byTier, setByTier] = useState<Partial<Record<TierId, TierProgress>>>({});
  const [cycle, setCycle] = useState<LuxuryCycle | null>(null);
  const [hasAnchor, setHasAnchor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getLuxuryProgress();
        if (cancelled || res?.error) return;
        const map: Partial<Record<TierId, TierProgress>> = {};
        for (const tp of res?.snapshot?.tierProgress ?? []) {
          if (tp?.tierId) map[tp.tierId as TierId] = tp;
        }
        if (!cancelled) {
          setByTier(map);
          setCycle(res?.cycle ?? null);
          setHasAnchor(!!res?.snapshot?.hasAnchor);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Same focus logic as /rewards — pending review wins over “next open tier”
  const focusId = useMemo<TierId>(() => {
    const pendingApproval = cycle?.status === "REWARD_PENDING_APPROVAL";
    if (pendingApproval && cycle?.qualifiedTierId) return cycle.qualifiedTierId;
    const open = TIER_ORDER.find((id) => {
      const tp = byTier[id];
      return tp && !tp.qualified && tp.windowOpen !== false;
    });
    if (open) return open;
    return TIER_ORDER.find((id) => !byTier[id]?.qualified) ?? "1CR";
  }, [byTier, cycle?.qualifiedTierId, cycle?.status]);

  const pendingApproval = cycle?.status === "REWARD_PENDING_APPROVAL";
  const claimed = cycle?.status === "CLAIMED";
  const status = resolveStageStatus(byTier[focusId], {
    isCurrent: true,
    pendingApproval,
    claimed,
    qualifiedTierId: cycle?.qualifiedTierId,
  });

  const meta = TIER_META[focusId];
  const statusLabel = STATUS_LINE[status] ?? "In progress";

  if (loading) {
    return (
      <section className="rounded-[22px] border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:rounded-3xl md:p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading rewards…
        </div>
      </section>
    );
  }

  return (
    <Link
      href="/rewards"
      className="block rounded-[22px] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)] md:rounded-3xl"
    >
      <div className="flex items-center gap-3 p-3 md:gap-4 md:p-4">
        <div
          className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl md:h-20 md:w-28"
          style={{ background: meta.accentSoft }}
        >
          <Image
            src={meta.image}
            alt={`${meta.label} prize`}
            fill
            className="object-contain p-1.5"
            sizes="112px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Luxury rewards · Stage {meta.stage} of 4
          </p>
          <p className="mt-0.5 truncate text-base font-black text-[#0F172A] md:text-lg">
            {meta.label}{" "}
            <span style={{ color: meta.accent }}>({focusId})</span>
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500 md:text-sm">
            {hasAnchor ? statusLabel : "Open Rewards to start your path"}
            {hasAnchor ? ` · ${meta.prizes}` : ""}
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0F172A] px-3 py-1.5 text-xs font-bold text-white">
          Rewards <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
