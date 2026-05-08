"use client";

interface HeroProps {
  totalDepositedUsd: number;
  totalGoldGrams: number;
  maturityValueUsd: number;
  totalCashBonusUsd: number;
  goldRateUsd: number | null;
  hasEnrollment: boolean;
}

function fmt(v: number) {
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SgnxGoldHero({
  totalDepositedUsd,
  totalGoldGrams,
  maturityValueUsd,
  totalCashBonusUsd,
  goldRateUsd,
  hasEnrollment,
}: HeroProps) {
  const liveGoldValue = goldRateUsd ? totalGoldGrams * goldRateUsd : 0;
  const profitUsd = maturityValueUsd - totalDepositedUsd;
  const profitPct = totalDepositedUsd > 0 ? (profitUsd / totalDepositedUsd) * 100 : 0;

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-[#E8E8E8] bg-white p-6 shadow-sm sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#C41E3A]/6 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#D7AF35]/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E8] bg-[#F8F9FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B6B1F]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            SGNX Gold Portfolio
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#111827] sm:text-5xl">
            {fmt(maturityValueUsd)}
            <span className="ml-2 text-lg font-semibold text-zinc-500 sm:text-2xl">Maturity Value</span>
          </h1>
          {hasEnrollment && profitPct > 0 && (
            <p className="mt-1 text-2xl font-extrabold text-[#C41E3A]">+{profitPct.toFixed(1)}% bonus</p>
          )}
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Track your SGNX Gold investments, bonus accumulation, and live market data.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Total Invested</p>
              <p className="mt-1 text-xl font-extrabold text-[#111827]">{fmt(totalDepositedUsd)}</p>
            </div>
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Gold Holdings</p>
              <p className="mt-1 text-xl font-extrabold text-[#111827]">{totalGoldGrams.toFixed(4)}g</p>
              <p className="text-xs text-zinc-500">{goldRateUsd ? fmt(liveGoldValue) : "—"}</p>
            </div>
            <div className="rounded-2xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Cash Bonus</p>
              <p className="mt-1 text-xl font-extrabold text-[#111827]">{fmt(totalCashBonusUsd)}</p>
            </div>
          </div>
        </div>

        {/* Right — Vault card */}
        <div className="relative overflow-hidden rounded-[26px] border border-[#E8E8E8] bg-[#F8F9FA] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Investment Status</p>
          <h2 className="mt-2 text-2xl font-black text-[#111827]">
            {hasEnrollment ? "Active" : "No investment yet"}
          </h2>
          <p className="mt-1 max-w-[18rem] text-sm text-zinc-500">
            {hasEnrollment
              ? "Your portfolio is growing. Monthly payments are tracked automatically."
              : "Start your 11-month gold or cash investment plan today."}
          </p>

          {goldRateUsd && (
            <div className="mt-5 rounded-2xl border border-[#E8E8E8] bg-white p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Current Gold / gram</p>
              <p className="mt-1 text-2xl font-black text-[#111827]">{fmt(goldRateUsd)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
