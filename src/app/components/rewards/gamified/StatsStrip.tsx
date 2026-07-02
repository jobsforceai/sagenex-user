"use client";

import { Crown, Gift, KeyRound, Users } from "lucide-react";
import { CARD, SectionLabel } from "./rewards-ui";

type StatsStripProps = {
  yourSales: string;
  teamSales: string;
  activeLegs: number;
  keysUnlocked: number;
  totalKeys: number;
};

const TILES = [
  { key: "yourSales", label: "Your sales", icon: Gift, tone: "text-[#00b386]", bg: "bg-[#ECFDF5]" },
  { key: "teamSales", label: "Team sales", icon: Users, tone: "text-[#C41E3A]", bg: "bg-[#FFF1F4]" },
  { key: "activeLegs", label: "Active legs", icon: Crown, tone: "text-[#C41E3A]", bg: "bg-[#FFF1F4]" },
  { key: "keys", label: "Steps done", icon: KeyRound, tone: "text-[#00b386]", bg: "bg-[#ECFDF5]" },
] as const;

export default function StatsStrip({
  yourSales,
  teamSales,
  activeLegs,
  keysUnlocked,
  totalKeys,
}: StatsStripProps) {
  const values: Record<string, string> = {
    yourSales,
    teamSales,
    activeLegs: String(activeLegs),
    keys: `${keysUnlocked}/${totalKeys}`,
  };

  return (
    <section className={`${CARD} p-4 sm:p-5`}>
      <SectionLabel>Your numbers</SectionLabel>
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
        {TILES.map(({ key, label, icon: Icon, tone, bg }) => (
          <div key={key} className="rounded-xl border border-[#F1F5F9] bg-[#FAFBFC] p-3.5">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${tone}`} />
            </div>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
            <p className="mt-0.5 font-display text-lg font-black text-[#0F172A]">{values[key]}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
