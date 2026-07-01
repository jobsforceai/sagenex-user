"use client";

type RewardsHeaderProps = {
  dateLabel: string;
  yourSales: string;
  teamSales: string;
  activeLegs: number;
  keysUnlocked: number;
  totalKeys: number;
};

export default function RewardsHeader({
  dateLabel,
  yourSales,
  teamSales,
  activeLegs,
  keysUnlocked,
  totalKeys,
}: RewardsHeaderProps) {
  const stats = [
    { label: "Your sales", value: yourSales },
    { label: "Team sales", value: teamSales },
    { label: "Active legs", value: String(activeLegs) },
    { label: "Steps done", value: `${keysUnlocked}/${totalKeys}` },
  ];

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C41E3A]">Rewards</p>
          <h1 className="font-display text-2xl font-black text-[#0F172A] sm:text-3xl">My rewards</h1>
          <p className="mt-1 max-w-lg text-sm text-[#64748B]">
            See your progress and what to do next to unlock luxury and travel rewards.
          </p>
        </div>
        <p className="text-sm font-medium text-[#94A3B8]">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
            <p className="mt-1 truncate font-display text-lg font-black text-[#0F172A]">{value}</p>
          </div>
        ))}
      </div>
    </header>
  );
}
