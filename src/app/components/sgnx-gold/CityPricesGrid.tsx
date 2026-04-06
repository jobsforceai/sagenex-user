"use client";

import { useEffect, useMemo, useState } from "react";

interface CityPrice {
  city: string;
  pricePerGram: number;
}

interface CityPricesGridProps {
  prices: CityPrice[];
}

function citySeed(city: string) {
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = (hash * 31 + city.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatINR(v: number) {
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CityPricesGrid({ prices }: CityPricesGridProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 2400);
    return () => window.clearInterval(id);
  }, []);

  const rows = useMemo(() => {
    return prices.map((item) => {
      const wobble = ((((citySeed(item.city) + tick * 17) % 13) - 6) / 10) * 0.15;
      return { city: item.city, value: item.pricePerGram + wobble };
    });
  }, [prices, tick]);

  if (!prices || prices.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[#3c4256] bg-[#1B1F2D] p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B92AA]">Regional Board</p>
          <h3 className="mt-1 text-lg font-bold text-[#ECEFF8]">City Live Gold Prices</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Streaming
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.city}
            className="flex items-center justify-between rounded-xl border border-[#3c4256]/60 bg-[#1B1F2D]/50 px-4 py-3"
          >
            <p className="text-sm font-medium text-[#B2B7CB]">{row.city}</p>
            <p className="text-base font-bold text-[#D7AF35]">{formatINR(row.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
