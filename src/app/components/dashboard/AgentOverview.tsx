// components/AgentOverview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Calendar, Lock, CheckCircle2, Star } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";
import { getTieredROIRate } from "@/lib/roi";

type Props = {
  name?: string;
  currentLevel?: string;
  nextLevelLabel?: string;
  progressPct?: number;
  avatarUrl?: string;
  accentColorClass?: string;
  joinDate: string;
  packageUSD?: number;
};

const ranks = ["Member", "Starter", "Builder", "Leader", "Manager", "Director", "Crown"];

const allEarningStreams = [
  { name: "ROI", unlockedAt: "Member" },
  { name: "Direct Bonus (10%)", unlockedAt: "Starter" },
  { name: "Re-invest Bonus (8% → 2%)", unlockedAt: "Starter" },
  { name: "Unilevel Bonus (10% split L1-L6)", unlockedAt: "Starter" },
  { name: "Performance Bonus (5-16%)", unlockedAt: "Builder" },
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
  joinDate,
  packageUSD,
}: Props) {
  const endDate = useMemo(() => {
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 40);
    return end;
  }, [joinDate]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    setTimeLeft(getTimeLeft(endDate));
    return () => clearInterval(timer);
  }, [endDate]);

  const pct = Math.max(0, Math.min(100, progressPct || 0));
  const currentRankIndex = currentLevel ? ranks.indexOf(currentLevel) : -1;

  const rankMultiplier =
    currentRankIndex !== -1
      ? currentRankIndex <= 1
        ? "2.5x"
        : "4x"
      : null;

  const roiPercentage = packageUSD ? getTieredROIRate(packageUSD) * 100 : 0;

  const earningStreams = allEarningStreams.map(stream => {
    if (stream.name === "ROI" && roiPercentage) {
      return { ...stream, name: `ROI (${roiPercentage}%)` };
    }
    return stream;
  });

  const unlockedStreams = earningStreams.filter(
    (stream) => currentRankIndex >= ranks.indexOf(stream.unlockedAt)
  );

  const nextLevelUnlocks = nextLevelLabel
    ? earningStreams.filter((stream) => stream.unlockedAt === nextLevelLabel)
    : [];

  return (
    <Card className="bg-[#0b0b0b] border border-emerald-900/40 rounded-2xl">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col">
          <div className="flex flex-col md:flex-row items-center w-full justify-between">
            <div className="md:hidden justify-self-center md:justify-self-end">
                <div className="h-20 w-20 rounded-full overflow-hidden border border-neutral-700">
                  <Image src={avatarUrl} alt={`${name} avatar`} width={80} height={80} unoptimized className="object-cover h-20 w-20" />
                </div>
              </div>
            <div className="grid grid-cols-1 lg:w-1/3 md:grid-cols-[1fr,auto] items-start">
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
                  {rankMultiplier && (
                    <span className="text-lg font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md">
                      {rankMultiplier}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:w-2/3 items-end">
              <div className="hidden md:block justify-self-center md:justify-self-end">
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
                      <span className="ml-auto text-green-400 font-semibold tabular-nums">{pct}%</span>
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
        </div>
      </CardContent>
    </Card>
  );
}

function TimeBox({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-4xl md:text-5xl font-bold tabular-nums">{value.toString().padStart(2, "0")}</span>
      <span className="text-neutral-400 text-lg md:text-xl">{unit}</span>
    </div>
  );
}

function getTimeLeft(target: Date) {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}
