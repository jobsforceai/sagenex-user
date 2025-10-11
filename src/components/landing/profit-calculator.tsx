// components/ProfitCalculator.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  X,
  TrendingUp,
  Info,
  RefreshCcw,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type AssetKey = "sagenex" | "gold" | "land" | "stocks" | "cash";

type Asset = {
  key: AssetKey;
  label: string;
  color: string;
  defaultAPR: number;
  editable?: boolean;
  hint: string;
};

const GOLD_GRAD = "bg-gradient-to-r from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";
const GOLD_STROKE = "rgba(245,192,78,.35)";

const ASSETS: Asset[] = [
  { key: "sagenex", label: "Sagenex", color: "#F5C04E", defaultAPR: 12, editable: true, hint: "Adjust expected annual return (illustrative)." },
  { key: "stocks",  label: "Stock Market", color: "#7EE3C3", defaultAPR: 8, editable: true, hint: "Long-run nominal avg often ~7–10%." },
  { key: "gold",    label: "Gold", color: "#EAB308", defaultAPR: 6, editable: true, hint: "Historic nominal trend ~4–8% with cycles." },
  { key: "land",    label: "Land / Real Estate", color: "#34D399", defaultAPR: 4.5, editable: true, hint: "Appreciation ex-rent; location specific." },
  { key: "cash",    label: "Cash (Ref)", color: "#B0B8C4", defaultAPR: 3, editable: true, hint: "Bank/APY (varies)." },
];

function compound(principal: number, ratePct: number, years: number) {
  const r = ratePct / 100;
  return principal * Math.pow(1 + r, years);
}

export default function ProfitCalculator() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating glass button */}
      <button
        aria-label="Calculate your profits"
        onClick={() => setOpen(true)}
        className={[
          "fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2",
          "rounded-full px-4 py-3 text-sm font-semibold text-white",
          "backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,.45)]",
          "hover:bg-white/14 active:scale-[.98] transition",
        ].join(" ")}
        style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.25), 0 10px 40px rgba(0,0,0,.45)",
        }}
      >
        {/* <span className={`inline-block h-2 w-2 rounded-full ${GOLD_GRAD}`} /> */}
        <Calculator className="h-4 w-4 text-white/90" />
        Calculate your profits
      </button>

      <AnimatePresence>{open && <CalculatorModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState(1000);
  const [years, setYears] = useState(3);
  const [inflation, setInflation] = useState(4);
  const [rates, setRates] = useState<Record<AssetKey, number>>(
    Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>
  );
  const [showReal, setShowReal] = useState(false);

  const data = useMemo(() => {
    const out = ASSETS.map(a => {
      const effective = showReal
        ? ((1 + rates[a.key] / 100) / (1 + inflation / 100) - 1) * 100
        : rates[a.key];
      const final = compound(amount, effective, years);
      const profit = final - amount;
      return { key: a.key, label: a.label, color: a.color, final, profit, rateUsed: effective };
    });
    return out.sort((a, b) => b.profit - a.profit);
  }, [amount, years, rates, showReal, inflation]);

  const reset = () => {
    setAmount(1000);
    setYears(3);
    setInflation(4);
    setRates(Object.fromEntries(ASSETS.map(a => [a.key, a.defaultAPR])) as Record<AssetKey, number>);
    setShowReal(false);
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Backdrop with soft noise */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 15% 0%, rgba(16,185,129,.10), transparent 60%), radial-gradient(60% 80% at 85% 40%, rgba(245,192,78,.10), transparent 60%), url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='table' tableValues='0 .03'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundBlendMode: "screen",
          opacity: .25,
        }}
      />

      {/* Glass modal shell */}
      <motion.div
        role="dialog" aria-modal="true"
        className="relative z-[71] w-full max-w-5xl rounded-3xl p-0 max-h-[90vh] overflow-auto md:overflow-visible"
        initial={{ y: 30, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
      >
        {/* glass body */}
        <div
          className={[
            "rounded-3xl border border-white/20",
            "backdrop-blur-2xl bg-white/[.08] shadow-[0_40px_120px_rgba(0,0,0,.6)]",
            "relative overflow-hidden",
          ].join(" ")}
          style={{
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), 0 40px 120px rgba(0,0,0,.6)`,
          }}
        >
          {/* inner golden edge */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ boxShadow: `inset 0 0 0 1px ${GOLD_STROKE}` }} />

          {/* header bar */}
          <div className="relative flex items-start justify-between gap-4 p-6 sm:p-7">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Profit Comparison <span className={`text-transparent bg-clip-text ${GOLD_GRAD}`}>Calculator</span>
              </h3>
              <p className="mt-1 text-sm text-white/80">
                Enter amount & horizon. Compare{" "}
                <span className={`text-transparent bg-clip-text ${GOLD_GRAD}`}>Sagenex vs Gold • Land • Stocks • Cash</span>.
              </p>
            </div>
            <button aria-label="Close calculator" onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 p-2 text-white/90 hover:bg-white/15">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* controls row (glass cards) */}
          <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-3">
            <GlassInput label="Amount (USD)" value={amount} min={50} step={50} onChange={setAmount} suffix="USD" />
            <GlassInput label="Years" value={years} min={1} max={15} step={1} onChange={setYears} />
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4 text-white/70" />
                  Inflation
                </label>
                <div className="text-sm text-white/85">{inflation}%</div>
              </div>
              <input type="range" min={0} max={12} value={inflation}
                className="mt-2 w-full accent-emerald-300" onChange={(e) => setInflation(parseFloat(e.target.value))} />
              <div className="mt-2 flex items-center justify-between">
                <label className="text-sm text-white/85">Show real returns</label>
                <input type="checkbox" className="h-4 w-4 accent-emerald-400" checked={showReal} onChange={(e) => setShowReal(e.target.checked)} />
              </div>
            </div>
          </div>

          {/* rates editor (glass tiles) */}
          <div className="mt-4 grid grid-cols-1 gap-3 px-6 grid-flow-row-dense sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {ASSETS.map(a => (
              <div key={a.key} className="rounded-2xl border border-white/20 bg-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-white">{a.label}</div>
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                </div>
                <div className="mt-1.5 text-sm text-white/85">APR: <span className="font-semibold">{rates[a.key].toFixed(1)}%</span></div>
                <input type="range" min={0} max={a.key === "sagenex" ? 40 : 20} step={0.5} disabled={!a.editable}
                  value={rates[a.key]} className="mt-2 w-full accent-yellow-300 disabled:opacity-40"
                  onChange={(e)=>setRates(r => ({...r,[a.key]: parseFloat(e.target.value)}))}/>
                <p className="mt-1 text-[11px] text-white/70 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> {a.hint}
                </p>
              </div>
            ))}
          </div>

          {/* viz: glass panels */}
          <div className="mt-6 grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Final Value after {years}y</div>
                <div className="text-xs text-white/70">{showReal ? "Inflation-adjusted (real)" : "Nominal"}</div>
              </div>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer>
                  <BarChart data={data.map(d=>({name:d.label, Final: Math.round(d.final)}))}
                    margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,.85)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,.85)", fontSize: 12 }} />
                    {/* <Tooltip contentStyle={{
                        background: "rgba(18,26,22,.2)",
                        border: "1px solid rgba(255,255,255,.2)",
                        color: "white", backdropFilter: "blur(10px)"
                      }}
                      formatter={(v:any)=>[`$${Number(v).toLocaleString()}`,"Value"]}/> */}
                    <Bar dataKey="Final" radius={[8,8,0,0]} fill="#7EE3C3" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Breakdown</div>
                <button onClick={reset}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white/90 hover:bg-white/15">
                  <RefreshCcw className="h-3.5 w-3.5"/> Reset
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-white">
                  <thead className="text-white/80">
                    <tr className="text-left">
                      <th className="py-2">Asset</th><th className="py-2">Rate</th><th className="py-2">Final</th><th className="py-2">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(d=>(
                      <tr key={d.key} className="border-t border-white/15">
                        <td className="py-2"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{background:d.color}} />{d.label}</td>
                        <td className="py-2">{d.rateUsed.toFixed(2)}%</td>
                        <td className="py-2">${d.final.toLocaleString(undefined,{maximumFractionDigits:0})}</td>
                        <td className="py-2">
                          <span className={d.profit>=0? "text-emerald-300":"text-rose-300"}>
                            {d.profit>=0?"+":"-"}${Math.abs(d.profit).toLocaleString(undefined,{maximumFractionDigits:0})}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-[11px] text-white/75 flex items-start gap-2">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5" />
                  <p>Illustrative only. Toggle “real returns” to see results after inflation. Not financial advice.</p>
                </div>
              </div>
            </div>
          </div>

          {/* bottom gold underline */}
          {/* <div className={`mx-6 mb-6 h-[3px] w-40 rounded-full ${GOLD_GRAD}`} /> */}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Reusable glass input ---------- */
function GlassInput({
  label, value, min, max, step = 1, onChange, suffix,
}:{
  label:string; value:number; min?:number; max?:number; step?:number; onChange:(v:number)=>void; suffix?:string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={(e)=>onChange(Number(e.target.value))}
          className="w-full sm:w-36 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-emerald-300/30 focus:ring-2 placeholder:text-white/60"
        />
        {suffix && <span className="text-xs text-white/75">{suffix}</span>}
      </div>
      {min!==undefined && max!==undefined && (
        <input type="range" className="mt-2 w-full accent-emerald-300"
          min={min} max={max} step={step} value={value}
          onChange={(e)=>onChange(Number(e.target.value))}/>
      )}
    </div>
  );
}
