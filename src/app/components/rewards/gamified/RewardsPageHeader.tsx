"use client";

type RewardsPageHeaderProps = {
  dateLabel: string;
};

export default function RewardsPageHeader({ dateLabel }: RewardsPageHeaderProps) {
  return (
    <header className="rounded-2xl border border-[#E2E8F0] bg-white px-5 py-5 shadow-[0_4px_24px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C41E3A]">Rewards</p>
          <h1 className="mt-1 font-display text-2xl font-black text-[#0F172A] sm:text-3xl">My rewards</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#64748B]">
            Track your progress, see what is left to unlock, and claim luxury and travel rewards.
          </p>
        </div>
        <p className="text-sm font-semibold text-[#94A3B8]">{dateLabel}</p>
      </div>
    </header>
  );
}
