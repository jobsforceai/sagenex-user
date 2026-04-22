"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, Info, RefreshCcw, Percent } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

type AssetKey = "sagenex" | "gold" | "land" | "stocks" | "cash";
type Asset = { key: AssetKey; label: string; color: string; defaultAPR: number; hint: string };

const ASSETS: Asset[] = [
  { key: "sagenex", label: "Sagenex",         color: "#00b386", defaultAPR: 12, hint: "Adjust expected annual return (illustrative)." },
  { key: "stocks",  label: "Stock Market",    color: "#6366f1", defaultAPR: 8,  hint: "Long-run nominal avg often ~7–10%." },
  { key: "gold",    label: "Gold",            color: "#d97706", defaultAPR: 6,  hint: "Historic nominal trend ~4–8% with cycles." },
  { key: "land",    label: "Real Estate",     color: "#0ea5e9", defaultAPR: 4.5,hint: "Appreciation ex-rent; location specific." },
  { key: "cash",    label: "Cash (Ref)",      color: "#9ca3af", defaultAPR: 3,  hint: "Bank/APY (varies)." },
];

function compound(p: number, r: number, y: number) { return p * Math.pow(1 + r / 100, y); }

export default function ProfitCalculator() {
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(3);
  const [inflation, setInflation] = useState(4);
  const [showReal, setShowReal] = useState(false);
  const [rates, setRates] = useState<Record<AssetKey, number>>(
    Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>
  );

  const data = useMemo(() => ASSETS.map(a => {
    const eff = showReal ? ((1 + rates[a.key] / 100) / (1 + inflation / 100) - 1) * 100 : rates[a.key];
    const final = compound(amount, eff, years);
    return { key: a.key, label: a.label, color: a.color, final, profit: final - amount, rate: eff };
  }).sort((a, b) => b.profit - a.profit), [amount, years, rates, showReal, inflation]);

  const reset = () => {
    setAmount(1000); setYears(3); setInflation(4); setShowReal(false);
    setRates(Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>);
  };

  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block bg-[#e6f7f3] text-[#00875f] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Calculator className="inline h-3.5 w-3.5 mr-1.5" />
            Profit Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-3">
            See How Your Money <span className="text-[#00b386]">Grows</span>
          </h2>
          <p className="text-[#555] max-w-xl mx-auto">
            Compare Sagenex returns against Gold, Real Estate, Stocks, and Cash side by side.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#f7f8fa] border border-[#e8e8e8] rounded-3xl p-6 sm:p-8"
        >
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Amount */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <label className="text-sm font-semibold text-[#1a1a1a] block mb-2">Amount (USD)</label>
              <input
                type="number" min={50} step={50} value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full border border-[#e8e8e8] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#00b386]/30"
              />
              <input type="range" min={50} max={100000} step={50} value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="mt-2 w-full accent-[#00b386]" />
            </div>
            {/* Years */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <label className="text-sm font-semibold text-[#1a1a1a] block mb-2">Years: {years}</label>
              <input type="range" min={1} max={15} value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-[#00b386] mt-1" />
              <div className="flex justify-between text-xs text-[#888] mt-1">
                <span>1 yr</span><span>15 yrs</span>
              </div>
            </div>
            {/* Inflation */}
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-[#888]" /> Inflation: {inflation}%
                </label>
              </div>
              <input type="range" min={0} max={12} value={inflation}
                onChange={e => setInflation(parseFloat(e.target.value))}
                className="w-full accent-[#00b386]" />
              <div className="flex items-center justify-between mt-2">
                <label className="text-xs text-[#555]">Show real returns</label>
                <input type="checkbox" className="h-4 w-4 accent-[#00b386]" checked={showReal}
                  onChange={e => setShowReal(e.target.checked)} />
              </div>
            </div>
          </div>

          {/* Rate sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {ASSETS.map(a => (
              <div key={a.key} className="bg-white border border-[#e8e8e8] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1a1a1a]">{a.label}</span>
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
                </div>
                <div className="text-xs text-[#555] mb-1">APR: <span className="font-bold">{rates[a.key].toFixed(1)}%</span></div>
                <input type="range" min={0} max={a.key === "sagenex" ? 40 : 20} step={0.5}
                  value={rates[a.key]}
                  style={{ accentColor: a.color }}
                  className="w-full"
                  onChange={e => setRates(r => ({ ...r, [a.key]: parseFloat(e.target.value) }))} />
                <p className="text-[10px] text-[#888] mt-1 flex items-start gap-1">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" /> {a.hint}
                </p>
              </div>
            ))}
          </div>

          {/* Chart + table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#1a1a1a] mb-3">Final Value after {years} year{years > 1 ? "s" : ""}</p>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={data.map(d => ({ name: d.label, Value: Math.round(d.final), fill: d.color }))}
                    margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e8e8e8", fontSize: 12 }} />
                    <Bar dataKey="Value" radius={[6, 6, 0, 0]} fill="#00b386" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1a1a1a]">Breakdown</p>
                <button onClick={reset}
                  className="inline-flex items-center gap-1 border border-[#e8e8e8] rounded-lg px-2 py-1 text-xs text-[#555] hover:bg-[#f7f8fa]">
                  <RefreshCcw className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#888] text-xs">
                    <th className="pb-2">Asset</th><th className="pb-2">Rate</th><th className="pb-2">Final</th><th className="pb-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.key} className="border-t border-[#f0f0f0]">
                      <td className="py-2 text-[#1a1a1a]">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          {d.label}
                        </div>
                      </td>
                      <td className="py-2 text-[#555]">{d.rate.toFixed(1)}%</td>
                      <td className="py-2 text-[#1a1a1a] font-medium">${d.final.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className="py-2 font-semibold" style={{ color: d.profit >= 0 ? "#00b386" : "#ef4444" }}>
                        {d.profit >= 0 ? "+" : "-"}${Math.abs(d.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 text-[11px] text-[#888] flex items-start gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Illustrative only. Not financial advice.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
