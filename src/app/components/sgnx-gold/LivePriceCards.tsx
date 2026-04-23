"use client";

import { useIndicativePrice } from "@/lib/useTickingPrice";

interface LivePriceData {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface LivePriceCardsProps {
  gold: LivePriceData | null;
  silver: LivePriceData | null;
  activeMetal: "gold" | "silver";
  onMetalChange: (metal: "gold" | "silver") => void;
}

const GRAMS_PER_OUNCE = 31.1035;

function formatINR(price: number) {
  return "₹" + price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LivePriceCards({
  gold,
  silver,
  activeMetal,
  onMetalChange,
}: LivePriceCardsProps) {
  const goldBase10g = gold ? (gold.price / GRAMS_PER_OUNCE) * 10 : 0;
  const silverBase1kg = silver ? (silver.price / GRAMS_PER_OUNCE) * 1000 : 0;
  const { value: goldPrice10g } = useIndicativePrice(goldBase10g);
  const { value: silverPrice1kg } = useIndicativePrice(silverBase1kg);
  const isGoldUp = gold ? gold.changePercent >= 0 : true;
  const isSilverUp = silver ? silver.changePercent >= 0 : true;

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {/* Gold */}
      <button
        onClick={() => onMetalChange("gold")}
        className={`relative w-full overflow-hidden rounded-2xl border p-6 text-left transition ${
          activeMetal === "gold"
            ? "border-[#D7AF35]/40 bg-white"
            : "border-[#E8E8E8] bg-white hover:border-[#D7AF35]/35"
        }`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D7AF35]/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Live Rate</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Gold 24K</h3>
          </div>
          {gold && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isGoldUp ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              {isGoldUp ? "+" : ""}{gold.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
        <p className="mt-3 text-4xl font-black tracking-tight text-[#C41E3A]">
          {gold ? formatINR(goldPrice10g) : "—"}
        </p>
        <p className="mt-1 text-xs text-zinc-400">Per 10 grams</p>
      </button>

      {/* Silver */}
      <button
        onClick={() => onMetalChange("silver")}
        className={`relative w-full overflow-hidden rounded-2xl border p-6 text-left transition ${
          activeMetal === "silver"
            ? "border-[#E8E8E8] bg-white"
            : "border-[#E8E8E8] bg-white hover:border-[#E8E8E8]"
        }`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#9ca3af]/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Live Rate</p>
            <h3 className="mt-1 text-xl font-bold text-[#111827]">Silver</h3>
          </div>
          {silver && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isSilverUp ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              {isSilverUp ? "+" : ""}{silver.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
        <p className="mt-3 text-4xl font-black tracking-tight text-[#111827]">
          {silver ? formatINR(silverPrice1kg) : "—"}
        </p>
        <p className="mt-1 text-xs text-zinc-400">Per 1 kilogram</p>
      </button>
    </section>
  );
}
