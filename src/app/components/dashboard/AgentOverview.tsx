// components/AgentOverview.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Calendar } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  name?: string;
  currentLevel?: string; // e.g. "GM"
  nextLevelLabel?: string; // e.g. "Director"
  progressPct?: number; // 0..100
  avatarUrl?: string;
  accentColorClass?: string; // optional tailwind text color for level (default green)
  joinDate: string; // ISO date string
};

export default function AgentOverview({
  name = "Alex Mercer",
  currentLevel,
  nextLevelLabel,
  progressPct,
  avatarUrl = "/avatar-placeholder.jpg",
  accentColorClass = "text-green-400",
  joinDate,
}: Props) {
  // Countdown: 40-day challenge starting from the user's join date
  const endDate = useMemo(() => {
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 40); // 40-day challenge window
    return end;
  }, [joinDate]);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    // Set the initial time left immediately on mount
    setTimeLeft(getTimeLeft(endDate));
    return () => clearInterval(timer);
  }, [endDate]);

  const pct = Math.max(0, Math.min(100, progressPct || 0));

  return (
    <Card className="bg-[#0b0b0b] border border-emerald-900/40  rounded-2xl">
      <CardContent>
        <div className="flex flex-row w-full justify-between">
          {/* Top part: Info and Avatar */}
          <div className="grid grid-cols-1 w-1/3 md:grid-cols-[1fr,auto] items-start ">
            {/* Left Column: Info & Countdown */}
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold">{name}</h2>
              <p className="text-neutral-400 mt-2">Current Level</p>
              {currentLevel ? (
                <div
                  className={clsx(
                    "text-4xl md:text-5xl font-extrabold leading-tight",
                    accentColorClass
                  )}
                >
                  {currentLevel}
                </div>
              ) : (
                <Skeleton className="h-12 w-24 mt-1" />
              )}

              <div className="mt-8">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Calendar className="h-4 w-4" />
                  <span>40-Day Challenge Countdown</span>
                </div>
                <div className="mt-3 flex items-end gap-6 text-cyan-300">
                  <TimeBox value={timeLeft.days} unit="d" />
                  <TimeBox value={timeLeft.hours} unit="h" />
                  <TimeBox value={timeLeft.minutes} unit="m" />
                  <TimeBox value={timeLeft.seconds} unit="s" />
                </div>
              </div>
            </div>

            {/* Right Column: Avatar */}
          </div>
          <div className="flex flex-col w-2/3 items-end">
            <div className="justify-self-center md:justify-self-end">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-neutral-700">
                <Image
                  src={avatarUrl}
                  alt={`${name} avatar`}
                  width={20}
                  height={20}
                  unoptimized
                  className="object-cover h-20 w-20"
                />
              </div>
            </div>
            <div className="w-full">
              {progressPct !== undefined && nextLevelLabel !== undefined ? (
                <>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Target className="h-4 w-4 text-neutral-400" />
                    <span className="text-neutral-300">
                      Progress to Next Level: {nextLevelLabel}
                    </span>
                    <span className="ml-auto text-green-400 font-semibold tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-3 relative">
                    <div className="h-3 w-full rounded-full bg-neutral-800" />
                    <div
                      className="absolute left-0 top-0 h-3 rounded-full bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-2">
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeBox({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-4xl md:text-5xl font-bold tabular-nums">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-neutral-400 text-lg md:text-xl">{unit}</span>
    </div>
  );
}

function getTimeLeft(target: Date) {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  return { days, hours, minutes, seconds };
}
