// components/GamifiedChallenges.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Shield } from "lucide-react";
import clsx from "clsx";

type Badge = {
  label: string;
  earned?: boolean; // earned => green pill, else gray pill
};

type Requirement = {
  text: string;
  met?: boolean;
};

type Props = {
  title?: string;
  subtitle?: string;
  progressPct: number; // 0..100
  badges: Badge[];
  requirements: Requirement[];
};

export default function GamifiedChallenges({
  title = "Gamified Challenges",
  subtitle = "Sell 5 Packages in 40 Days",
  progressPct,
  badges,
  requirements,
}: Props) {
  const pct = Math.max(0, Math.min(100, progressPct));

  return (
    <Card className="bg-[#0b0b0b] border border-neutral-800">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        </div>
        <p className="text-neutral-400 mt-1">{subtitle}</p>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Progress */}
        <div className="mb-2 text-neutral-300 font-medium">Progress</div>
        <div className="relative">
          <div className="h-3 w-full rounded-full bg-neutral-800" />
          <div
            className="absolute left-0 top-0 h-3 rounded-full bg-green-500"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute -right-1 -top-5 text-green-400 font-semibold tabular-nums">
            {pct}%
          </div>
        </div>

        {/* Badge rewards */}
        <div className="mt-8 text-neutral-300 font-medium">Badge Rewards</div>
        <div className="mt-3 flex flex-wrap gap-3">
          {badges.map((b) => (
            <BadgePill key={b.label} label={b.label} earned={!!b.earned} />
          ))}
        </div>

        {/* Next Rank Requirements */}
        {requirements.length > 0 && (
          <>
            <div className="mt-8 text-neutral-300 font-medium">Next Rank Requirements</div>
            <ul className="mt-3 space-y-3">
              {requirements.map((r, i) => (
                <li
                  key={i}
                  className={clsx(
                    "flex items-start gap-3",
                    r.met ? "text-green-400" : "text-neutral-500"
                  )}
                >
                  <Shield
                    className={clsx(
                      "h-5 w-5 mt-0.5",
                      r.met ? "text-green-400" : "text-neutral-600"
                    )}
                  />
                  <span className={clsx("leading-relaxed", r.met && "font-medium")}>
                    {r.text}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BadgePill({ label, earned }: { label: string; earned: boolean }) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm border",
        earned
          ? "bg-green-500/20 text-green-300 border-green-600/50"
          : "bg-neutral-900 text-neutral-300 border-neutral-700"
      )}
    >
      <Shield
        className={clsx(
          "h-4 w-4",
          earned ? "text-green-300" : "text-neutral-400"
        )}
      />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
