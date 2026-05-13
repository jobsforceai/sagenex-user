"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getHistoricalPrices } from "@/actions/sgnxgold";
import { useIndicativePrice } from "@/lib/useTickingPrice";
import { Loader2 } from "lucide-react";

const RANGES = ["1D", "1W", "1M", "5M", "1Y", "5Y"] as const;
type Range = (typeof RANGES)[number];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
type Currency = (typeof CURRENCIES)[number];

const GRAMS_PER_OUNCE = 31.1035;

interface PriceChartProps {
  metal: "gold" | "silver";
  onMetalChange: (metal: "gold" | "silver") => void;
}

interface DataPoint {
  time: string;
  price: number;
}

function formatXAxis(value: string, range: Range) {
  const d = new Date(value);
  if (range === "1D") return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (range === "1W") return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit" });
  if (range === "1M" || range === "5M") return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function formatCurrencyValue(value: number, currency: Currency) {
  if (currency === "INR") return "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  if (currency === "USD") return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (currency === "EUR") return "€" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (currency === "GBP") return "£" + value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " AED";
}

export default function PriceChart({ metal, onMetalChange }: PriceChartProps) {
  const [range, setRange] = useState<Range>("1D");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [rawData, setRawData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth || 1,
          height: containerRef.current.offsetHeight || 1,
        });
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", handleResize);
    return () => { observer.disconnect(); window.removeEventListener("resize", handleResize); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistoricalPrices(metal, range, currency)
      .then((res) => {
        if (cancelled) return;
        setRawData(res?.data ?? []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setRawData([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [metal, range, currency]);

  // Convert oz prices to per-10g (gold) or per-1kg (silver)
  const chartData = useMemo(() => {
    const multiplier = metal === "gold" ? 10 / GRAMS_PER_OUNCE : 1000 / GRAMS_PER_OUNCE;
    return rawData.map((p) => ({ ...p, price: p.price * multiplier }));
  }, [rawData, metal]);

  const yDomain = useMemo((): [number, number] => {
    const prices = chartData.map((p) => p.price).filter(Number.isFinite);
    if (prices.length === 0) return [0, 1];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const spread = max - min;
    const padding = spread > 0 ? spread * 0.15 : Math.max(Math.abs(max) * 0.002, 1);
    return [min - padding, max + padding];
  }, [chartData]);

  const lineColor = metal === "gold" ? "#d4a843" : "#9ca3af";
  const metalLabel = metal === "gold" ? "Gold" : "Silver";

  // Current selected asset live stats with ticking
  const lastPoint = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const firstPoint = chartData.length > 0 ? chartData[0] : null;
  const { value: tickingPrice } = useIndicativePrice(lastPoint?.price ?? 0);
  const displayPrice = lastPoint ? tickingPrice : 0;
  const liveChange = firstPoint ? displayPrice - firstPoint.price : 0;
  const livePct = firstPoint && firstPoint.price > 0 ? (liveChange / firstPoint.price) * 100 : 0;
  const isUp = liveChange >= 0;

  return (
    <section className="rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Price Studio</p>
          <h3 className="mt-1 text-lg font-bold text-[#111827]">{metalLabel} trend intelligence</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onMetalChange("gold")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${metal === "gold" ? "bg-[#D7AF35]/15 text-[#8b6b1f]" : "bg-[#F8F9FA] text-zinc-500"}`}
          >
            Gold
          </button>
          <button
            type="button"
            onClick={() => onMetalChange("silver")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${metal === "silver" ? "bg-[#9CA3AF]/15 text-[#4b5563]" : "bg-[#F8F9FA] text-zinc-500"}`}
          >
            Silver
          </button>
        </div>
      </div>

      {/* Currency pills */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              currency === c
                ? "bg-[#C41E3A]/10 text-[#C41E3A]"
                : "bg-[#F8F9FA] text-zinc-500 hover:text-[#111827]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Range pills */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              range === r
                ? "bg-[#C41E3A]/10 text-[#C41E3A]"
                : "bg-[#F8F9FA] text-zinc-500 hover:text-[#111827]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-64 md:h-72">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 md:h-72 text-sm text-zinc-400">
          No data available for this range.
        </div>
      ) : (
        <div ref={containerRef} className="h-64 w-full min-h-0 min-w-0 md:h-72">
          <ResponsiveContainer width={containerSize.width || "100%"} height={containerSize.height || 300}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tickFormatter={(v) => formatXAxis(v, range)}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                minTickGap={28}
                interval="preserveStartEnd"
                stroke="#E8E8E8"
              />
              <YAxis
                tickFormatter={(v) => `${Math.round(v as number)}`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={60}
                stroke="#E8E8E8"
                domain={yDomain}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrencyValue(value, currency), metalLabel]}
                labelFormatter={(l) => {
                  const d = new Date(l as string);
                  return range === "1D"
                    ? d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                }}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E8E8E8",
                  borderRadius: "8px",
                  color: "#111827",
                }}
              />
              <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2.2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Current asset summary */}
      {lastPoint && (
        <div className="mt-5 rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Current Selected Asset</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-black text-[#111827]">
              {formatCurrencyValue(displayPrice, currency)}
            </span>
            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
              {isUp ? "▲" : "▼"} {formatCurrencyValue(Math.abs(liveChange), currency)} ({isUp ? "+" : ""}{livePct.toFixed(2)}%)
            </span>
            <span className="text-xs text-zinc-400">{metal === "gold" ? "Per 10 gm" : "Per 1 kg"}</span>
          </div>
        </div>
      )}
    </section>
  );
}
