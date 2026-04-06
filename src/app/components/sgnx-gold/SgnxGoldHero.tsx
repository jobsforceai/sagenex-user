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
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    <section className="relative overflow-hidden rounded-[30px] border border-[#7f70ba]/35 bg-[#1B1F2D] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:p-8">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8f73cc]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#d7af35]/18 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#d7af35]/30 bg-[#d7af35]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f8df8a]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            SGNX Gold Portfolio
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#ECEFF8] sm:text-5xl">
            {fmt(maturityValueUsd)}
            <span className="ml-2 text-lg font-semibold text-[#B2B7CB] sm:text-2xl">Maturity Value</span>
          </h1>
          {hasEnrollment && profitPct > 0 && (
            <p className="mt-1 text-2xl font-extrabold text-[#EFCB57]">+{profitPct.toFixed(1)}% bonus</p>
          )}
          <p className="mt-2 max-w-xl text-sm text-[#B2B7CB]">
            Track your SGNX Gold investments, bonus accumulation, and live market data.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#8a77c8]/30 bg-[#252A3A]/90 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Total Invested</p>
              <p className="mt-1 text-xl font-extrabold text-[#ECEFF8]">{fmt(totalDepositedUsd)}</p>
            </div>
            <div className="rounded-2xl border border-[#d7af35]/25 bg-[#252A3A]/90 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Gold Holdings</p>
              <p className="mt-1 text-xl font-extrabold text-[#EFCB57]">{totalGoldGrams.toFixed(4)}g</p>
              <p className="text-xs text-[#8B92AA]">{goldRateUsd ? fmt(liveGoldValue) : "—"}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-[#252A3A]/90 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8B92AA]">Cash Bonus</p>
              <p className="mt-1 text-xl font-extrabold text-emerald-300">{fmt(totalCashBonusUsd)}</p>
            </div>
          </div>
        </div>

        {/* Right — Vault card */}
        <div className="relative overflow-hidden rounded-[26px] border border-[#9d8ad5]/35 bg-gradient-to-br from-[#2E3456] via-[#4C4F79] to-[#6A5BA4] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9daf0]">Investment Status</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {hasEnrollment ? "Active" : "No investment yet"}
          </h2>
          <p className="mt-1 max-w-[18rem] text-sm text-[#d0d3e6]">
            {hasEnrollment
              ? "Your portfolio is growing. Monthly payments are tracked automatically."
              : "Start your 11-month gold or cash investment plan today."}
          </p>

          {goldRateUsd && (
            <div className="mt-5 rounded-2xl border border-white/20 bg-black/20 p-4 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Current Gold / gram</p>
              <p className="mt-1 text-2xl font-black text-[#F8DF8A]">{fmt(goldRateUsd)}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
