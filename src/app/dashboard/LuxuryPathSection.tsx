"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, IndianRupee, Users, Award } from "lucide-react";
import { getLuxuryProgress } from "@/actions/luxury-rewards";

type TierId = "10L" | "30L" | "50L" | "1CR";

const lakh = (n: number) =>
  n >= 10_000_000 ? "₹" + (n / 10_000_000).toFixed(2).replace(/\.00$/, "") + " Cr"
  : n >= 100_000  ? "₹" + (n / 100_000).toFixed(2).replace(/\.00$/, "") + " L"
  : n >= 1_000    ? "₹" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  : "₹" + Math.round(n).toLocaleString("en-IN");

const TIER_REQ: Record<TierId, { teamBiz: number; directBiz: number; legs: number; label: string }> = {
  "10L": { teamBiz:  1_000_000, directBiz:  50_000, legs: 2, label: "Starter" },
  "30L": { teamBiz:  3_000_000, directBiz: 150_000, legs: 3, label: "Mid"     },
  "50L": { teamBiz:  5_000_000, directBiz: 250_000, legs: 4, label: "Elite"   },
  "1CR": { teamBiz: 10_000_000, directBiz: 500_000, legs: 5, label: "Crown"   },
};

const TIER_RING: Record<TierId, { stroke: string; chipBg: string; chipFg: string }> = {
  "10L": { stroke: "stroke-amber-500",   chipBg: "bg-amber-50",   chipFg: "text-amber-700"   },
  "30L": { stroke: "stroke-emerald-500", chipBg: "bg-emerald-50", chipFg: "text-emerald-700" },
  "50L": { stroke: "stroke-sky-500",     chipBg: "bg-sky-50",     chipFg: "text-sky-700"     },
  "1CR": { stroke: "stroke-rose-500",    chipBg: "bg-rose-50",    chipFg: "text-rose-700"    },
};

export default function LuxuryPathSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLuxuryProgress();
        if (!res?.error) setData(res);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading || !data?.snapshot?.hasAnchor) {
    // For unauthenticated/no-cycle users we just don't render — keeps the
    // dashboard clean. The full page at /rewards/luxury handles onboarding.
    return null;
  }

  const snap = data.snapshot;
  const tiers: TierId[] = ["10L", "30L", "50L", "1CR"];
  const progByTier: Record<string, any> = {};
  for (const tp of (snap.tierProgress ?? [])) progByTier[tp.tierId] = tp;
  const chasing: TierId | null = tiers.find(t => !progByTier[t]?.qualified) ?? null;
  const pct = chasing ? Math.min(100, Math.round(progByTier[chasing]?.teamBizPct ?? 0)) : 100;
  const ring = chasing ? TIER_RING[chasing] : TIER_RING["1CR"];
  const req = chasing ? TIER_REQ[chasing] : null;

  return (
    <Link href="/rewards/luxury" className="block">
      <div className="rounded-[22px] border border-slate-200/70 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:shadow-[0_14px_40px_rgba(15,23,42,0.1)]">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Luxury Path</p>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black ${ring.chipBg} ${ring.chipFg}`}>
            <Crown className="h-3 w-3" />
            {chasing ? `Chasing ${chasing} ${req?.label}` : "All tiers ✓"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {/* Ring tile */}
          <div className="rounded-2xl border border-slate-100 bg-white p-1.5 text-center">
            <div className="relative mx-auto h-11 w-11">
              <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={ring.stroke}
                  strokeDasharray={`${pct} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#0F172A]">{pct}%</div>
            </div>
            <p className="mt-1 text-[7px] font-black uppercase tracking-[0.06em] text-[#64748B]">
              {chasing ? `To ${chasing}` : "Done"}
            </p>
          </div>

          <StatTile
            label="Team Biz"
            value={lakh(snap.cappedTeamBusinessINR ?? 0)}
            icon={IndianRupee}
            tone="text-emerald-700 bg-emerald-50"
          />
          <StatTile
            label="Direct"
            value={lakh(snap.directBusinessINR ?? 0)}
            icon={Award}
            tone="text-violet-600 bg-violet-50"
          />
          <StatTile
            label="Legs"
            value={`${snap.activeLegsCount ?? 0}${req ? `/${req.legs}` : ""}`}
            icon={Users}
            tone="text-blue-600 bg-blue-50"
          />
        </div>
      </div>
    </Link>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-1.5 text-center">
      <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1 break-words text-[12px] font-black leading-none text-[#0F172A]">{value}</p>
      <p className="mt-1 text-[7px] font-black uppercase tracking-[0.04em] text-[#64748B]">{label}</p>
    </div>
  );
}
