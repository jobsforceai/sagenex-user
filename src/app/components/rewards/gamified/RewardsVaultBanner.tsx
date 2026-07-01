"use client";

import { Gift, Sparkles } from "lucide-react";
import { SparkleDots } from "./RewardDecor";

type RewardsVaultBannerProps = {
  dateLabel: string;
  yourSales: string;
  teamSales: string;
  activeLegs: number;
  keysUnlocked: number;
  totalKeys: number;
};

export default function RewardsVaultBanner({
  dateLabel,
  yourSales,
  teamSales,
  activeLegs,
  keysUnlocked,
  totalKeys,
}: RewardsVaultBannerProps) {
  const stats = [
    { label: "Your sales", value: yourSales },
    { label: "Team sales", value: teamSales },
    { label: "Active legs", value: String(activeLegs) },
    { label: "Steps done", value: `${keysUnlocked}/${totalKeys}` },
  ];

  return (
    <section className="relative">
      <div
        data-luxury-dark
        className="rewards-vault-mesh relative overflow-hidden rounded-3xl px-5 pb-20 pt-6 sm:px-8 sm:pb-24 sm:pt-8"
      >
        <SparkleDots className="pointer-events-none absolute right-4 top-4 h-16 w-40 opacity-80" />
        <div className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 rounded-full bg-[#00b386]/20 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-md">
            <span className="rewards-glass-dark inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              <Sparkles className="h-3 w-3" />
              Rewards vault
            </span>
            <h1 className="mt-3 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              Your reward journey
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
              Every sale and team milestone brings you closer to luxury gifts and dream trips.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/60">{dateLabel}</p>
            <span className="rewards-glass-dark mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white">
              <Gift className="h-3.5 w-3.5" />
              Keep going — you&apos;re earning
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-14 grid grid-cols-2 gap-2.5 px-1 sm:-mt-16 sm:grid-cols-4 sm:gap-3 sm:px-2">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rewards-float-card rounded-2xl border border-[#F1F5F9] bg-white px-3.5 py-3.5 sm:px-4 sm:py-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
            <p className="mt-1 truncate font-display text-lg font-black text-[#0F172A] sm:text-xl">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
