"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BarChart3,
  Bot,
  CalendarDays,
  MessageCircle,
  Rocket,
  SendHorizontal,
  Sparkles,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";
import { getApiV1BaseUrl } from "@/lib/api-base";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Tier = {
  minPackage: number;
  maxPackage: number | null;
  rateMonthly: number;
  label: string;
};

type Plan = {
  name: string;
  tiers: Tier[];
};

type RoiResponse = {
  success: boolean;
  data: {
    new: Plan;
  };
};

type ChatStep = 0 | 1 | 2;
type ChatRole = "bot" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const DURATIONS: { value: number; label: string }[] = [
  { value: 12, label: "1 Year" },
  { value: 24, label: "2 Years" },
  { value: 36, label: "3 Years" },
  { value: 60, label: "5 Years" },
];

const inr = (value: number) =>
  value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const parseAmount = (value: string) => {
  const normalized = value.toLowerCase().replace(/,/g, "").replace(/₹/g, "").trim();
  const match = normalized.match(/[\d.]+/);
  if (!match) return null;
  const base = Number(match[0]);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (normalized.includes("cr")) return base * 10000000;
  if (normalized.includes("lakh") || normalized.includes("lac") || normalized.includes(" l")) return base * 100000;
  if (normalized.includes("k")) return base * 1000;
  return base;
};

const parseMonths = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("5") || normalized.includes("five")) return 60;
  if (normalized.includes("3") || normalized.includes("three")) return 36;
  if (normalized.includes("2") || normalized.includes("two")) return 24;
  if (normalized.includes("1") || normalized.includes("one")) return 12;
  return null;
};

function findTier(tiers: Tier[], amount: number): Tier | null {
  for (const tier of tiers) {
    const above = amount >= tier.minPackage;
    const below = tier.maxPackage === null || amount <= tier.maxPackage;
    if (above && below) return tier;
  }
  return null;
}

function project(tiers: Tier[], principal: number, months: number) {
  const monthlyRate = findTier(tiers, principal)?.rateMonthly ?? 0;
  const simpleMonthly = principal * monthlyRate;
  const simpleSeries: number[] = [];

  for (let month = 0; month <= months; month++) {
    simpleSeries.push(principal + simpleMonthly * month);
  }

  const compoundSeries: number[] = [principal];
  let packageAmount = principal;

  for (let month = 1; month <= months; month++) {
    const rate = findTier(tiers, packageAmount)?.rateMonthly ?? 0;
    packageAmount *= 1 + rate;
    compoundSeries.push(packageAmount);
  }

  return { simpleSeries, compoundSeries, monthlyRate };
}

export default function ProfitCalculator() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [amount, setAmount] = useState(100000);
  const [months, setMonths] = useState(24);
  const [chatStep, setChatStep] = useState<ChatStep>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("₹1,00,000");
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${getApiV1BaseUrl()}/config/roi-rates`;

    fetch(url)
      .then((response) => response.json())
      .then((json: RoiResponse) => {
        if (cancelled) return;
        if (json?.success && json.data?.new) {
          setPlan(json.data.new);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeTiers = plan ? plan.tiers : [];
  const minPackage = activeTiers[0]?.minPackage ?? 0;
  const belowMin = !!plan && amount < minPackage;

  const projection = useMemo(() => {
    if (!plan) return null;
    return project(activeTiers, amount, months);
  }, [plan, activeTiers, amount, months]);

  const tier = useMemo(() => {
    if (!plan) return null;
    return findTier(activeTiers, amount);
  }, [plan, activeTiers, amount]);

  const simpleTotal = projection ? projection.simpleSeries[months] ?? amount : amount;
  const compoundTotal = projection ? projection.compoundSeries[months] ?? amount : amount;
  const extraGain = Math.max(0, compoundTotal - simpleTotal);
  const monthlyRatePct = projection ? (projection.monthlyRate * 100).toFixed(1) : "0.0";
  const selectedDuration = DURATIONS.find((duration) => duration.value === months)?.label ?? `${months} Months`;
  const chartData = useMemo(() => {
    if (!projection) return [];
    const step = months <= 12 ? 1 : months <= 36 ? 3 : 6;
    const points = [];

    for (let month = 0; month <= months; month += step) {
      points.push({
        month,
        label: month === 0 ? "Today" : `${month}m`,
        simple: Math.round(projection.simpleSeries[month] ?? amount),
        compound: Math.round(projection.compoundSeries[month] ?? amount),
      });
    }

    if (points[points.length - 1]?.month !== months) {
      points.push({
        month: months,
        label: selectedDuration,
        simple: Math.round(simpleTotal),
        compound: Math.round(compoundTotal),
      });
    }

    return points;
  }, [amount, compoundTotal, months, projection, selectedDuration, simpleTotal]);

  const timeline = DURATIONS.map((duration) => {
    const snapshot = projection
      ? project(activeTiers, amount, duration.value).compoundSeries[duration.value] ?? amount
      : amount;
    return { ...duration, valueAtTime: snapshot };
  });

  const appendBot = (text: string) => {
    const id = `bot-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setChatMessages((messages) => [...messages, { id, role: "bot", text }]);
    setTypingMessageId(id);
    setResponseText(text);
  };

  const appendUser = (text: string) => {
    const id = `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setChatMessages((messages) => [...messages, { id, role: "user", text }]);
  };

  const sendBot = (text: string) => {
    window.setTimeout(() => appendBot(text), 120);
  };

  useEffect(() => {
    if (!plan || chatMessages.length > 0) return;
    appendBot("Start by sending your investment amount. Example: ₹1,00,000, 2 lakh, or 50000.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  useEffect(() => {
    if (!responseText) {
      setDisplayedResponse("");
      return;
    }
    setDisplayedResponse("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedResponse(responseText.slice(0, index));
      if (index >= responseText.length) window.clearInterval(timer);
    }, 12);
    return () => window.clearInterval(timer);
  }, [responseText]);

  useEffect(() => {
    const chatScroll = chatScrollRef.current;
    if (!chatScroll) return;
    chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const processMessage = (message: string) => {
    const normalized = message.toLowerCase();

    if (chatStep === 0) {
      const nextAmount = parseAmount(message);
      if (!nextAmount) {
        sendBot("Please send a clear amount like ₹1,00,000, 2 lakh, or 50000.");
        return;
      }
      setAmount(nextAmount);
      setChatStep(1);
      setInputValue("2 years");
      sendBot(`Amount locked at ${inr(nextAmount)}. Now choose duration: 1 year, 2 years, 3 years, or 5 years.`);
      return;
    }

    const nextMonths = parseMonths(message);
    if (nextMonths) {
      setMonths(nextMonths);
      setChatStep(2);
      setInputValue("Explain compounding");
      const nextDuration = DURATIONS.find((duration) => duration.value === nextMonths)?.label ?? `${nextMonths} Months`;
      sendBot(`Done. Your ${nextDuration.toLowerCase()} compounding report is now live on the right.`);
      return;
    }

    const nextAmount = parseAmount(message);
    if (nextAmount) {
      setAmount(nextAmount);
      setChatStep((step) => (step === 0 ? 1 : step));
      sendBot(`Updated amount to ${inr(nextAmount)}. The projection has refreshed.`);
      return;
    }

    if (normalized.includes("explain") || normalized.includes("how")) {
      sendBot("Simple ROI keeps the package flat. Compounding adds monthly ROI back into the package, so every next month starts from a larger base.");
      return;
    }

    sendBot("Send an amount, a duration like 3 years, or ask how compounding works.");
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = inputValue.trim();
    if (!message) return;
    appendUser(message);
    processMessage(message);
  };

  const quickSend = (message: string) => {
    setInputValue(message);
    appendUser(message);
    processMessage(message);
  };

  return (
    <section className="w-full landing-section-light py-16 sm:py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[#C8103E]">
            Wealth Compounding
          </span>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#0F172A] sm:text-4xl md:text-5xl">
            See how reinvested ROI changes the outcome.
          </h2>
          <p className="mt-4 text-base font-semibold text-[#64748B] sm:text-lg">
            Compare simple monthly ROI with compounding using live SAGENEX ROI tiers.
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]"
        >
          {loading && (
            <div className="grid min-h-[420px] place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#10B981]" />
            </div>
          )}

          {error && !loading && (
            <div className="grid min-h-[420px] place-items-center px-6 text-center text-sm font-semibold text-[#64748B]">
              Unable to load live ROI rates. Please refresh and try again.
            </div>
          )}

          {!loading && !error && plan && (
            <div className="grid lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.35fr)]">
              <aside className="border-b border-slate-200/80 bg-slate-50/60 p-4 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-[#FFF1F4] text-[#C8103E]">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#C8103E]">
                        Compounding Setup
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#64748B]">
                        Build the report through guided inputs.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      { icon: WalletCards, label: "Amount", value: inr(amount) },
                      { icon: CalendarDays, label: "Time", value: selectedDuration },
                      { icon: BarChart3, label: "ROI", value: `${monthlyRatePct}%` },
                    ].map((item) => (
                      <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <item.icon className="h-4 w-4 text-[#C8103E]" />
                        <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">{item.label}</p>
                        <p className="mt-1 truncate text-xs font-black text-[#0F172A]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/70">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">
                          {chatStep === 0 ? "Step 1" : chatStep === 1 ? "Step 2" : "Report Ready"}
                        </p>
                        <p className="mt-0.5 text-sm font-black text-[#0F172A]">
                          {chatStep === 0 ? "Lock amount" : chatStep === 1 ? "Choose duration" : "Tune projection"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#FFF1F4] px-3 py-1 text-xs font-black text-[#C8103E]">
                        {chatStep + 1}/3
                      </span>
                    </div>

                    <div ref={chatScrollRef} className="h-[240px] space-y-3 overflow-y-auto px-4 py-4">
                      {chatMessages.map((message) =>
                        message.role === "user" ? (
                          <div key={message.id} className="flex justify-end">
                            <div className="flex max-w-[88%] items-center gap-2 rounded-2xl rounded-tr-md bg-[#C8103E] px-3 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(200,16,62,0.18)]">
                              <UserRound className="h-3.5 w-3.5" />
                              {message.text}
                            </div>
                          </div>
                        ) : (
                          <div key={message.id} className="flex items-start gap-2.5">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                              <Bot className="h-3.5 w-3.5" />
                            </span>
                            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-3 py-2 text-xs leading-relaxed text-[#334155] shadow-sm">
                              {message.id === typingMessageId ? displayedResponse : message.text}
                              {message.id === typingMessageId && displayedResponse.length < responseText.length && (
                                <span className="ml-0.5 inline-block h-3 w-1 animate-pulse rounded-full bg-emerald-500 align-middle" />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div className="border-t border-slate-200 bg-white px-3 py-3">
                      <div className="mb-2 flex gap-2 overflow-x-auto">
                        {chatStep === 0 ? (
                          <>
                            <button type="button" onClick={() => quickSend("₹1,00,000")} className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-xs font-black text-[#C8103E]">₹1,00,000</button>
                            <button type="button" onClick={() => quickSend("2 lakh")} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#0F172A]">2 lakh</button>
                            <button type="button" onClick={() => quickSend("5 lakh")} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#0F172A]">5 lakh</button>
                          </>
                        ) : (
                          <>
                            {DURATIONS.map((duration) => (
                              <button key={duration.value} type="button" onClick={() => quickSend(duration.label)} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#0F172A]">
                                {duration.label}
                              </button>
                            ))}
                            <button type="button" onClick={() => quickSend("Explain compounding")} className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">Explain</button>
                          </>
                        )}
                      </div>
                      <form onSubmit={handleSend} className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2">
                        <input
                          value={inputValue}
                          onChange={(event) => setInputValue(event.target.value)}
                          className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                          placeholder={chatStep === 0 ? "Enter amount" : "Enter duration"}
                        />
                        <button type="submit" className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#C8103E] px-3 text-[10px] font-black text-white hover:bg-[#A50D33]">
                          Send
                          <SendHorizontal className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-3xl border p-4 ${
                    belowMin
                      ? "border-amber-200 bg-amber-50"
                      : "border-emerald-100 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <BadgeCheck className={`mt-0.5 h-5 w-5 ${belowMin ? "text-amber-600" : "text-emerald-700"}`} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">
                        Active Tier
                      </p>
                      <p className="mt-1 text-base font-black text-[#0F172A]">
                        {belowMin ? `Minimum ${inr(minPackage)} required` : tier?.label ?? "Tier unavailable"}
                      </p>
                      {!belowMin && (
                        <p className="mt-2 text-2xl font-black text-emerald-700">
                          {monthlyRatePct}% <span className="text-sm text-[#64748B]">monthly ROI</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              <div className="p-4 sm:p-6 lg:p-8">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748B]">
                        Future Value
                      </p>
                      <p className="mt-2 text-4xl font-black tracking-tight text-emerald-700 sm:text-5xl">
                        {inr(compoundTotal)}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-relaxed text-[#64748B] sm:text-base">
                        Projected after <span className="font-black text-[#0F172A]">{selectedDuration.toLowerCase()}</span>{" "}
                        from {inr(amount)} invested today.
                      </p>
                    </div>
                    <span className="w-fit rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                      +{inr(extraGain)} extra gain
                    </span>
                  </div>

                  <div className="mt-6 h-56 rounded-3xl bg-gradient-to-b from-white to-emerald-50/50 p-3 sm:h-72 sm:p-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="landingCompoundArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.04} />
                          </linearGradient>
                          <linearGradient id="landingSimpleArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 8" vertical={false} />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#64748B", fontSize: 11, fontWeight: 700 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          hide
                          domain={["dataMin", "dataMax"]}
                        />
                        <Tooltip
                          formatter={(value: number, name) => [inr(Number(value)), name === "compound" ? "Compounding" : "Simple ROI"]}
                          labelFormatter={(label) => label}
                          contentStyle={{
                            border: "1px solid #E2E8F0",
                            borderRadius: 16,
                            boxShadow: "0 14px 35px rgba(15,23,42,0.12)",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="simple"
                          stroke="#94A3B8"
                          strokeWidth={2}
                          fill="url(#landingSimpleArea)"
                          dot={false}
                          activeDot={{ r: 4, fill: "#94A3B8", stroke: "#FFFFFF", strokeWidth: 2 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="compound"
                          stroke="#059669"
                          strokeWidth={3}
                          fill="url(#landingCompoundArea)"
                          dot={{ r: 4, fill: "#059669", stroke: "#ECFDF5", strokeWidth: 3 }}
                          activeDot={{ r: 6, fill: "#059669", stroke: "#ECFDF5", strokeWidth: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 sm:p-4">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#64748B]">Simple ROI</p>
                    <p className="mt-1 truncate text-base font-black text-[#0F172A] sm:text-2xl">{inr(simpleTotal)}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500 bg-emerald-50 p-3 sm:p-4">
                    <Rocket className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-emerald-700">Compounding</p>
                    <p className="mt-1 truncate text-base font-black text-emerald-700 sm:text-2xl">{inr(compoundTotal)}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
                    <Trophy className="h-5 w-5 text-amber-600" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#64748B]">Extra Gain</p>
                    <p className="mt-1 truncate text-base font-black text-amber-600 sm:text-2xl">+{inr(extraGain)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0F172A]">Timeline</p>
                    <p className="text-[11px] font-bold text-[#64748B]">Tap a point to change duration</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {timeline.map((item) => {
                      const active = item.value === months;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setMonths(item.value)}
                          className={`rounded-2xl border px-3 py-3 text-left transition ${
                            active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-100 bg-slate-50 text-[#64748B] hover:bg-slate-100"
                          }`}
                        >
                          <span className="block text-xs font-black">{item.label}</span>
                          <span className="mt-1 block truncate text-[11px] font-bold">{inr(item.valueAtTime)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#C8103E]" />
                    <p className="text-xs font-semibold leading-relaxed text-[#64748B] sm:text-sm">
                      Projections are illustrative and use the currently loaded ROI tiers. Compounding assumes monthly ROI is reinvested into the active package.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
