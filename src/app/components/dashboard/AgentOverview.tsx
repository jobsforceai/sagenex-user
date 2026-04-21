// components/AgentOverview.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, Lock, CheckCircle2, Star, Info } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FIRST_DEPOSIT_DIRECT_BONUS_PCT,
  REINVESTMENT_UPLINE_PCTS,
  UNILEVEL_PCTS,
  getTieredROIRate,
} from "@/lib/roi";
import CountdownTimer from "./CountdownTimer";

type Props = {
  name?: string;
  currentLevel?: string;
  nextLevelLabel?: string;
  progressPct?: number;
  avatarUrl?: string;
  accentColorClass?: string;
  packageUSD?: number;
  earningsMultiplier?: number;
  earningsMultiplierDeadline?: string | null;
};

const ranks = ["Member", "Starter", "Builder", "Leader", "Manager", "Director", "Crown"];

const formatPct = (value: number) => {
  const percent = Math.round(value * 1000) / 10;
  return `${percent}%`;
};

const reinvestmentTotals = REINVESTMENT_UPLINE_PCTS.map((cycle) =>
  cycle.reduce((sum, pct) => sum + pct, 0)
);
const reinvestmentMin = Math.min(...reinvestmentTotals);
const reinvestmentMax = Math.max(...reinvestmentTotals);

const directBonusLabel = `Direct Bonus (${formatPct(FIRST_DEPOSIT_DIRECT_BONUS_PCT)})`;
const reinvestmentLabel = `Reinvestment Bonus (${formatPct(reinvestmentMax)} → ${formatPct(reinvestmentMin)})`;
const unilevelLabel = `Unilevel Bonus (${UNILEVEL_PCTS.map(formatPct).join("/")})`;

const allEarningStreams = [
  { name: "Special Bonus", unlockedAt: "Member" },
  { name: directBonusLabel, unlockedAt: "Starter" },
  { name: reinvestmentLabel, unlockedAt: "Starter" },
  { name: unilevelLabel, unlockedAt: "Starter" },
  { name: "Performance Bonus (4-14%)", unlockedAt: "Builder" },
  { name: "Director Bonus (15% pool)", unlockedAt: "Leader" },
  { name: "Leadership Overriding (18%)", unlockedAt: "Leader" },
  { name: "Travel Fund (3%)", unlockedAt: "Manager" },
  { name: "Car Fund (5%)", unlockedAt: "Director" },
  { name: "House Fund (3%)", unlockedAt: "Crown" },
  { name: "Elite Club Bonus (2%)", unlockedAt: "Crown" },
];

export default function AgentOverview({
  name = "Alex Mercer",
  currentLevel,
  nextLevelLabel,
  progressPct,
  avatarUrl = "/avatar-placeholder.jpg",
  accentColorClass = "text-green-400",
  packageUSD,
  earningsMultiplier,
  earningsMultiplierDeadline,
}: Props) {
  const pct = Math.max(0, Math.min(100, progressPct || 0));
  const currentRankIndex = currentLevel ? ranks.indexOf(currentLevel) : -1;

  const specialBonusRate = packageUSD ? getTieredROIRate(packageUSD) : 0;

  const earningStreams = allEarningStreams;

  const unlockedStreams = earningStreams.filter(
    (stream) => currentRankIndex >= ranks.indexOf(stream.unlockedAt)
  );

  const nextLevelUnlocks = nextLevelLabel
    ? earningStreams.filter((stream) => stream.unlockedAt === nextLevelLabel)
    : [];

  return (
    <Card className="bg-[#0b0b0b] border border-emerald-900/40 rounded-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row w-full justify-between gap-6 md:gap-4">
          <div className="w-full md:w-1/3">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">{name}</h2>
              <p className="text-neutral-400 mt-2">Current Level</p>
              <div className="flex items-baseline gap-3">
                {currentLevel ? (
                  <div className={clsx("text-4xl md:text-5xl font-extrabold leading-tight", accentColorClass)}>
                    {currentLevel}
                  </div>
                ) : (
                  <Skeleton className="h-12 w-24 mt-1" />
                )}
                {earningsMultiplier && (
                  <span className="text-lg font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">
                    {earningsMultiplier}x
                  </span>
                )}
              </div>
              {/* 3x / 4x qualification rules */}
              <div className="mt-3 rounded-lg border border-neutral-700/60 bg-neutral-800/40 p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 font-semibold uppercase tracking-wide text-[10px]">
                  <Info className="h-3 w-3" />
                  Earnings Multiplier Rules (monthly / 30 days)
                </div>
                <div className={`flex items-start gap-2 ${earningsMultiplier && earningsMultiplier >= 3 ? 'text-yellow-300' : 'text-neutral-300'}`}>
                  <span className="font-bold shrink-0">3x</span>
                  <span>3 legs × ≥ ₹1.5L business + ₹5L total team volume</span>
                </div>
                <div className={`flex items-start gap-2 ${earningsMultiplier === 4 ? 'text-yellow-300' : 'text-neutral-300'}`}>
                  <span className="font-bold shrink-0">4x</span>
                  <span>4 legs × ≥ ₹2L business + ₹10L total team volume + KYC verified</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full md:w-2/3 items-start md:items-end">
            <div className="flex justify-end w-full">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-neutral-700">
                <Image src={avatarUrl} alt={`${name} avatar`} width={80} height={80} unoptimized className="object-cover h-20 w-20" />
              </div>
            </div>
            <div className="w-full mt-2">
              {progressPct !== undefined && nextLevelLabel ? (
                <>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Target className="h-4 w-4 text-neutral-400" />
                    <span>Progress to {nextLevelLabel}</span>
                    <span className="ml-auto text-green-400 font-semibold tabular-nums">{Math.round(pct)}%</span>
                  </div>
                  <div className="mt-2 relative">
                    <div className="h-3 w-full rounded-full bg-neutral-800" />
                    <div className="absolute left-0 top-0 h-3 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                </>
              ) : (
                <div className="mt-2">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        <CountdownTimer deadline={earningsMultiplierDeadline} />

        <div className="mt-6 pt-6 border-t border-neutral-800/50">
          <h3 className="text-lg font-semibold text-white/90 mb-4">Earning Streams</h3>
          {currentLevel ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                {unlockedStreams.map((stream) => (
                  <div key={stream.name} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-white/80">{stream.name}</span>
                  </div>
                ))}
              </div>
              {nextLevelUnlocks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dashed border-neutral-700">
                  <h4 className="text-sm font-semibold text-yellow-400/90 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Unlocks at {nextLevelLabel}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                    {nextLevelUnlocks.map((stream) => (
                      <div key={stream.name} className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                        <span className="text-sm text-neutral-500">{stream.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
