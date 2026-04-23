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
    <section className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Regional Board</p>
          <h3 className="mt-1 text-lg font-bold text-[#111827]">City Live Gold Prices</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E8] bg-[#F8F9FA] px-3 py-1 text-[11px] font-semibold text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#C41E3A]" />
          Streaming
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.city}
            className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-3"
          >
            <p className="text-sm font-medium text-zinc-600">{row.city}</p>
            <p className="text-base font-bold text-[#111827]">{formatINR(row.value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
