"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  MessageCircle,
  Rocket,
  SendHorizontal,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getCompoundingStatus, toggleCompounding } from "@/actions/user";
import { getLegacyTieredROIRate, getNewTieredROIRate, getTieredROIRate } from "@/lib/roi";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChatStep = 0 | 1 | 2;

type ChatRole = "bot" | "user";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface Snapshot {
  month: number;
  simpleEarnings: number;
  compoundEarnings: number;
  compoundPackage: number;
  extra: number;
}

const STEPS = [
  { label: "01", title: "Inputs" },
  { label: "02", title: "Modelling" },
  { label: "03", title: "Report" },
] as const;

const PERIODS = [
  { label: "1 Year", months: 12 },
  { label: "2 Years", months: 24 },
  { label: "3 Years", months: 36 },
] as const;

const RATE_OPTIONS = [6, 7, 8, 10] as const;

const VALUE_PERIODS = [
  { label: "1 Year", months: 12 },
  { label: "2 Years", months: 24 },
  { label: "3 Years", months: 36 },
  { label: "5 Years", months: 60 },
] as const;

const fmt = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const parseAmount = (value: string) => {
  const normalized = value.toLowerCase().replace(/,/g, "").replace(/₹/g, "").trim();
  const match = normalized.match(/[\d.]+/);
  if (!match) return null;
  const base = Number(match[0]);
  if (!Number.isFinite(base) || base <= 0) return null;
  if (normalized.includes("cr")) return base * 10000000;
  if (normalized.includes("lakh") || normalized.includes("lac") || /\d\s*l\b/.test(normalized)) return base * 100000;
  if (normalized.includes("k")) return base * 1000;
  return base;
};

const parseRate = (value: string) => {
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const rate = Number(match[1]);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

const parseMonths = (value: string) => {
  const normalized = value.toLowerCase();
  const hasDurationToken = (token: string) =>
    new RegExp(`(^|[^a-z0-9])${token}($|[^a-z0-9])`, "i").test(normalized);

  if (hasDurationToken("5") || hasDurationToken("five")) return 60;
  if (hasDurationToken("3") || hasDurationToken("three")) return 36;
  if (hasDurationToken("2") || hasDurationToken("two")) return 24;
  if (hasDurationToken("1") || hasDurationToken("one")) return 12;
  return null;
};

function buildSnapshot(packageAmount: number, rateFn: (amount: number) => number, months: number): Snapshot {
  let compoundPackage = packageAmount;
  let simpleEarnings = 0;
  let compoundEarnings = 0;

  for (let month = 1; month <= months; month++) {
    const simple = packageAmount * rateFn(packageAmount);
    const compound = compoundPackage * rateFn(compoundPackage);
    simpleEarnings += simple;
    compoundEarnings += compound;
    compoundPackage += compound;
  }

  return {
    month: months,
    simpleEarnings,
    compoundEarnings,
    compoundPackage,
    extra: compoundEarnings - simpleEarnings,
  };
}

function buildSeries(packageAmount: number, rateFn: (amount: number) => number, months: number) {
  const points = [{ month: 0, label: "Now", simple: packageAmount, compound: packageAmount }];
  let compoundPackage = packageAmount;
  let simpleEarnings = 0;

  for (let month = 1; month <= months; month++) {
    simpleEarnings += packageAmount * rateFn(packageAmount);
    compoundPackage += compoundPackage * rateFn(compoundPackage);
    points.push({
      month,
      label: month === months ? `${Math.round(months / 12)}Y` : `${month}M`,
      simple: Math.round(packageAmount + simpleEarnings),
      compound: Math.round(compoundPackage),
    });
  }

  const step = months <= 12 ? 2 : months <= 36 ? 4 : 6;
  const filtered = points.filter((point) => point.month === 0 || point.month % step === 0);
  if (filtered[filtered.length - 1]?.month !== months) {
    filtered.push(points[points.length - 1]);
  }
  return filtered;
}

interface CompoundingProjectionModalProps {
  manualOpen?: boolean;
  onManualClose?: () => void;
  onCompoundingChange?: (enabled: boolean) => void;
}

export function CompoundingProjectionModal({
  manualOpen,
  onManualClose,
  onCompoundingChange,
}: CompoundingProjectionModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [packageAmount, setPackageAmount] = useState(0);
  const [modelAmount, setModelAmount] = useState(0);
  const [roiRate, setRoiRate] = useState(0);
  const [customRatePct, setCustomRatePct] = useState<number | null>(null);
  const [roiPlanType, setRoiPlanType] = useState<"old" | "new" | undefined>(undefined);
  const [months, setMonths] = useState(24);
  const [chatStep, setChatStep] = useState<ChatStep>(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("Use current package");
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [compoundingEnabled, setCompoundingEnabled] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const baseRateFn =
    roiPlanType === "new"
      ? getNewTieredROIRate
      : Math.abs(getLegacyTieredROIRate(packageAmount) - roiRate) < 1e-9
        ? getLegacyTieredROIRate
        : getTieredROIRate;

  const effectiveRate = customRatePct === null ? roiRate : customRatePct / 100;
  const effectiveRatePct = effectiveRate * 100;
  const hasEffectiveRate = effectiveRatePct > 0;
  const accountRateLabel = `${Math.round(effectiveRatePct)}%`;
  const rateFn = customRatePct === null ? baseRateFn : () => effectiveRate;
  const selectedPeriod = PERIODS.find((period) => period.months === months)?.label ?? `${months} Months`;
  const report = useMemo(
    () => buildSnapshot(modelAmount, rateFn, months),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelAmount, months, customRatePct, roiRate, roiPlanType, packageAmount]
  );
  const valueOptions = useMemo(
    () => VALUE_PERIODS.map((period) => ({ ...period, snapshot: buildSnapshot(modelAmount, rateFn, period.months) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelAmount, customRatePct, roiRate, roiPlanType, packageAmount]
  );
  const simpleTotalValue = modelAmount + report.simpleEarnings;
  const chartData = useMemo(
    () => buildSeries(modelAmount, rateFn, months),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelAmount, months, customRatePct, roiRate, roiPlanType, packageAmount]
  );
  const hasProjection = chatStep === 2 && !isBuilding;

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

  const resetConversation = (amount: number) => {
    setChatStep(0);
    setChatMessages([]);
    setTypingMessageId(null);
    setResponseText("");
    setDisplayedResponse("");
    setInputValue("Use current package");
    setCustomRatePct(null);
    setMonths(24);
    setIsBuilding(false);
    setBuildProgress(0);
    window.setTimeout(() => {
      appendBot(`Let's build your compounding projection. First confirm the starting amount. Your current package is ${fmt(amount)}.`);
    }, 80);
  };

  const rebuildProjection = (nextMonths = months) => {
    setMonths(nextMonths);
    setIsBuilding(true);
  };

  const selectRate = (rate: number) => {
    setCustomRatePct(rate);
    rebuildProjection();
  };

  const selectPeriod = (nextMonths: number) => {
    rebuildProjection(nextMonths);
  };

  useEffect(() => {
    if (manualOpen) return;
    getCompoundingStatus().then((res) => {
      if (!res?.error && res?.isPackageActive && (res?.packageUSD ?? 0) > 0) {
        const amount = res.packageUSD ?? 0;
        setPackageAmount(amount);
        setModelAmount(amount);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType ?? undefined);
        setRoiRate(res.roiRate ?? 0);
        resetConversation(amount);
        setOpen(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!manualOpen) return;
    getCompoundingStatus().then((res) => {
      if (!res?.error) {
        const amount = res.packageUSD ?? 0;
        setPackageAmount(amount);
        setModelAmount(amount);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType ?? undefined);
        setRoiRate(res.roiRate ?? 0);
        resetConversation(amount);
        setOpen(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualOpen]);

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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

  useEffect(() => {
    if (!isBuilding) return;
    setBuildProgress(8);
    const values = [25, 50, 75, 100];
    let index = 0;
    let finishTimer: number | undefined;
    const timer = window.setInterval(() => {
      setBuildProgress(values[index]);
      index += 1;
      if (index >= values.length) {
        window.clearInterval(timer);
        finishTimer = window.setTimeout(() => {
          setIsBuilding(false);
          setChatStep(2);
        }, 360);
      }
    }, 430);
    return () => {
      window.clearInterval(timer);
      if (finishTimer !== undefined) window.clearTimeout(finishTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuilding]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onManualClose?.();
  };

  const closeModal = () => {
    setOpen(false);
    onManualClose?.();
  };

  const processMessage = (message: string) => {
    const normalized = message.toLowerCase();

    if (chatStep === 0) {
      const amount = normalized.includes("current") ? packageAmount : parseAmount(message);
      if (!amount) {
        sendBot("Send a starting amount like ₹1,00,000, 1 lakh, or type current package.");
        return;
      }
      setModelAmount(amount);
      setChatStep(1);
      setInputValue(`${Math.round(effectiveRate * 100)}% for ${selectedPeriod}`);
      sendBot(`Starting amount locked at ${fmt(amount)}. Now send ROI and duration, like 7% for 2 years.`);
      return;
    }

    if (chatStep === 1) {
      const rate = parseRate(message);
      const nextMonths = parseMonths(message);
      if (!rate && !nextMonths) {
        sendBot("For Step 2, send ROI and duration together. Example: 7% for 2 years.");
        return;
      }
      if (rate) setCustomRatePct(rate);
      if (nextMonths) setMonths(nextMonths);
      if (!nextMonths) {
        sendBot(`ROI set to ${rate}%. Now send duration: 1 year, 2 years, 3 years, or 5 years.`);
        return;
      }
      setIsBuilding(true);
      setInputValue("Explain compounding");
      sendBot("Great. I am modelling the projection now.");
      return;
    }

    if (normalized.includes("explain") || normalized.includes("how")) {
      sendBot("Simple ROI pays out monthly. Compounding adds ROI back into your package, so the next month earns from a bigger base.");
      return;
    }

    const nextMonths = parseMonths(message);
    const rate = parseRate(message);
    if (rate) setCustomRatePct(rate);
    if (nextMonths) rebuildProjection(nextMonths);
    if (rate || nextMonths) {
      sendBot("Updated. I am rebuilding the projection with your new inputs.");
      return;
    }

    sendBot("Your report is ready on the right. Send a new ROI or duration anytime.");
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

  const handleToggle = async () => {
    setEnabling(true);
    try {
      const res = await toggleCompounding();
      if (res?.error) {
        toast.error(res.error);
      } else {
        const next = !compoundingEnabled;
        setCompoundingEnabled(next);
        onCompoundingChange?.(next);
        toast.success(next ? "Compounding enabled!" : "Compounding disabled.");
        closeModal();
      }
    } catch {
      toast.error(compoundingEnabled ? "Failed to disable compounding." : "Failed to enable compounding.");
    } finally {
      setEnabling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[min(94vh,800px)] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 text-[#0F172A] shadow-[0_30px_90px_rgba(15,23,42,0.2)] sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="border-b border-slate-200/70 px-5 py-3 sm:px-7">
            <span className="flex items-start justify-between gap-4">
              <span>
                <span className="flex items-center gap-3 text-lg font-black sm:text-xl">
                  <MessageCircle className="h-6 w-6 text-[#C8103E]" />
                  Compounding Calculator
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#64748B]">Real numbers. Real freedom.</span>
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.7fr)]">
          <section className="flex min-h-0 flex-1 flex-col border-b border-slate-200/70 bg-white p-3 lg:border-b-0 lg:border-r sm:p-5">
            <div className="grid grid-cols-3 gap-2">
              {STEPS.map((step, index) => (
                <div key={step.label} className="min-w-0">
                  <div className={`h-1.5 rounded-full ${index <= chatStep ? "bg-[#C8103E]" : "bg-slate-200"}`} />
                  <div className="mt-3 flex items-center gap-2">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black ${
                      index < chatStep
                        ? "bg-emerald-600 text-white"
                        : index === chatStep
                          ? "bg-[#C8103E] text-white"
                          : "bg-slate-100 text-[#94A3B8]"
                    }`}>
                      {index < chatStep ? <Check className="h-3.5 w-3.5" /> : step.label}
                    </span>
                    <span className="truncate text-xs font-black text-[#64748B]">
                      {step.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mt-4 sm:gap-2">
              {[
                { icon: WalletCards, label: "Amount", value: fmt(modelAmount) },
                { icon: BarChart3, label: "ROI", value: `${effectiveRatePct.toFixed(0)}%` },
                { icon: CalendarDays, label: "Time", value: selectedPeriod },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm sm:rounded-2xl sm:p-3">
                  <div className="flex min-w-0 items-center gap-1.5 sm:block">
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-[#C8103E] sm:h-4 sm:w-4" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-wide text-[#94A3B8] sm:mt-2 sm:text-[10px]">{item.label}</p>
                      <p className="truncate text-[11px] font-black text-[#0F172A] sm:mt-1 sm:text-sm">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/70 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#C8103E]">Compounding Setup</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                    {chatStep === 0 ? "Confirm amount" : chatStep === 1 ? "Add ROI and duration" : "Projection ready"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {hasEffectiveRate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700 shadow-[0_8px_20px_rgba(16,185,129,0.12)]">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {effectiveRatePct.toFixed(0)}% ROI
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={enabling}
                    className={`relative h-8 w-14 rounded-full transition ${compoundingEnabled ? "bg-emerald-600" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-1 grid h-6 w-6 place-items-center rounded-full bg-white text-[8px] font-black transition ${
                      compoundingEnabled ? "left-7 text-emerald-700" : "left-1 text-slate-500"
                    }`}>
                      {compoundingEnabled ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <div className={isBuilding || hasProjection ? "hidden lg:flex lg:flex-col lg:gap-4" : "flex flex-col gap-4"}>
                  {chatMessages.map((message) =>
                    message.role === "user" ? (
                      <div key={message.id} className="flex justify-end pb-2">
                        <div className="flex max-w-[86%] items-center gap-2 rounded-2xl rounded-tr-md bg-[#C8103E] px-3 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(200,16,62,0.18)]">
                          <UserRound className="h-3.5 w-3.5" />
                          {message.text}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="flex items-start gap-2.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                        <div className="max-w-[86%] rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-3 py-2 text-xs leading-relaxed shadow-sm">
                          {message.id === typingMessageId ? displayedResponse : message.text}
                          {message.id === typingMessageId && displayedResponse.length < responseText.length && (
                            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse rounded-full bg-emerald-500 align-middle" />
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {isBuilding && (
                  <motion.div
                    key="mobile-building"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="lg:hidden rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    <div className="relative mx-auto grid h-24 w-24 place-items-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#C8103E"
                          strokeLinecap="round"
                          strokeWidth="8"
                          strokeDasharray={263.89}
                          initial={{ strokeDashoffset: 263.89 }}
                          animate={{ strokeDashoffset: 263.89 - (263.89 * buildProgress) / 100 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </svg>
                      <span className="relative text-xl font-black text-[#C8103E]">{buildProgress}%</span>
                    </div>
                    <p className="mt-3 text-sm font-black text-[#0F172A]">Building your projection</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-left">
                      {[
                        ["Inputs", buildProgress >= 25],
                        ["Monthly model", buildProgress >= 50],
                        ["Growth curve", buildProgress >= 75],
                        ["Report", buildProgress >= 100],
                      ].map(([label, done]) => (
                        <div key={String(label)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                          <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-[#94A3B8]"}`}>
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="text-[11px] font-black text-[#64748B]">{label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {hasProjection && (
                  <motion.div
                    key={`mobile-report-${months}-${Math.round(modelAmount)}-${customRatePct ?? "current"}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="lg:hidden space-y-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#64748B]">Future value</p>
                        <p className="mt-1 truncate text-3xl font-black text-emerald-700">{fmt(report.compoundPackage)}</p>
                        <p className="mt-1 text-[11px] font-bold leading-snug text-[#64748B]">
                          After <span className="text-[#0F172A]">{selectedPeriod.toLowerCase()}</span> from {fmt(modelAmount)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700">
                        +{fmt(report.extra)}
                      </span>
                    </div>

                    <div className="h-28 rounded-2xl bg-gradient-to-b from-white to-emerald-50/40 p-1.5">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="mobileModalCompoundArea" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 8" vertical={false} />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748B", fontSize: 9, fontWeight: 800 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Area
                            type="monotone"
                            dataKey="simple"
                            stroke="#94A3B8"
                            strokeWidth={2}
                            fill="transparent"
                            dot={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="compound"
                            stroke="#059669"
                            strokeWidth={3}
                            fill="url(#mobileModalCompoundArea)"
                            dot={{ r: 2.5, fill: "#059669", stroke: "#ECFDF5", strokeWidth: 2 }}
                            activeDot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        ["Simple", fmt(simpleTotalValue), "text-[#0F172A] bg-blue-50/50 border-blue-100"],
                        ["Compound", fmt(report.compoundPackage), "text-emerald-700 bg-emerald-50 border-emerald-200"],
                        ["Extra", `+${fmt(report.extra)}`, "text-amber-600 bg-amber-50 border-amber-200"],
                      ].map(([label, value, className]) => (
                        <div key={label} className={`min-w-0 rounded-2xl border p-2 ${className}`}>
                          <p className="text-[9px] font-black uppercase tracking-wide text-[#64748B]">{label}</p>
                          <p className="mt-1 truncate text-xs font-black">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {valueOptions.map(({ label, months: optionMonths, snapshot }) => (
                        <button
                          key={optionMonths}
                          type="button"
                          onClick={() => selectPeriod(optionMonths)}
                          className={`rounded-xl border px-1.5 py-2 text-center transition ${
                            months === optionMonths
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-transparent bg-slate-50 text-[#64748B]"
                          }`}
                        >
                          <span className="block text-[10px] font-black">{label}</span>
                          <span className="mt-1 block truncate text-[9px] font-bold">{fmt(snapshot.compoundPackage)}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className={`border-t border-slate-200 bg-white px-3 py-3 ${isBuilding || hasProjection ? "hidden lg:block" : ""}`}>
                <div className="mb-2 flex gap-2 overflow-x-auto">
                  {chatStep === 0 ? (
                    <>
                      <button type="button" onClick={() => quickSend("Use current package")} className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-xs font-black text-[#C8103E]">Current package</button>
                      <button type="button" onClick={() => quickSend("₹1,00,000")} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#0F172A]">₹1,00,000</button>
                    </>
                  ) : (
                    <>
                      {hasEffectiveRate && ![7, 10].includes(Math.round(effectiveRatePct)) && (
                        <button
                          type="button"
                          onClick={() => quickSend(`${accountRateLabel} for ${selectedPeriod.toLowerCase()}`)}
                          className="shrink-0 rounded-full border border-amber-300 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 px-3 py-1.5 text-xs font-black text-amber-700 shadow-[0_10px_24px_rgba(245,158,11,0.16)]"
                        >
                          {accountRateLabel} · MY ROI
                        </button>
                      )}
                      <button type="button" onClick={() => quickSend("7% for 2 years")} className="shrink-0 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-xs font-black text-[#C8103E]">7% · 2 yrs</button>
                      <button type="button" onClick={() => quickSend("10% for 3 years")} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-[#0F172A]">10% · 3 yrs</button>
                      <button type="button" onClick={() => quickSend("Explain compounding")} className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">Explain</button>
                    </>
                  )}
                </div>
                <form onSubmit={handleSend} className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2">
                  <input
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                    aria-label={chatStep === 0 ? "Enter amount" : "Enter ROI and duration"}
                    placeholder={chatStep === 0 ? "Enter amount" : "Enter ROI and duration"}
                  />
                  <button type="submit" className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#C8103E] px-3 text-[10px] font-black text-white hover:bg-[#A50D33]">
                    Send
                    <SendHorizontal className="h-3 w-3" />
                  </button>
                </form>
              </div>
            </div>
          </section>

          <aside className="hidden min-h-[560px] overflow-hidden bg-slate-50/40 p-3 lg:block lg:min-h-0 sm:p-4">
            <AnimatePresence mode="wait" initial={false}>
              {isBuilding ? (
                <motion.div
                  key="building"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="grid h-full place-items-center rounded-3xl border border-slate-200/80 bg-white p-4 text-center shadow-sm sm:p-6"
                >
                  <div>
                    <div className="relative mx-auto grid h-32 w-32 place-items-center">
                      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#C8103E"
                          strokeLinecap="round"
                          strokeWidth="8"
                          strokeDasharray={263.89}
                          initial={{ strokeDashoffset: 263.89 }}
                          animate={{ strokeDashoffset: 263.89 - (263.89 * buildProgress) / 100 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </svg>
                      <span className="relative text-2xl font-black text-[#C8103E]">{buildProgress}%</span>
                    </div>
                    <h3 className="mt-5 text-xl font-black text-[#0F172A] sm:text-2xl">Building your projection</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-[#64748B]">Running monthly compounding across your selected horizon.</p>
                    <div className="mx-auto mt-6 grid max-w-lg gap-2 text-left sm:grid-cols-2">
                      {[
                        ["Securing your inputs", buildProgress >= 25],
                        ["Modelling monthly compounding", buildProgress >= 50],
                        ["Projecting growth curve", buildProgress >= 75],
                        ["Composing your report", buildProgress >= 100],
                      ].map(([label, done], index) => (
                        <div key={String(label)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5">
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-[#94A3B8]"}`}>
                            {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <span className={`text-sm font-bold ${done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : !hasProjection ? (
                <motion.div
                  key={`intro-${chatStep}`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-[#FFF1F4] p-4 sm:p-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C8103E]">Wealth Compounding</p>
                    <h3 className="mt-3 max-w-xl text-2xl font-black tracking-tight text-[#0F172A] sm:mt-4 sm:text-4xl">
                      Build your compounding projection.
                    </h3>
                    <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-[#64748B]">
                      First confirm the amount, then choose ROI and duration. Once both are locked, this panel becomes your live compounding report.
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
                      {[
                        ["1", "Lock amount", chatStep > 0],
                        ["2", "Model ROI", chatStep > 1 || isBuilding],
                        ["3", "Read report", false],
                      ].map(([label, title, done]) => (
                        <div key={String(title)} className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm sm:p-4">
                          <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${done ? "bg-emerald-600 text-white" : "bg-[#FFF1F4] text-[#C8103E]"}`}>
                            {done ? <Check className="h-4 w-4" /> : label}
                          </span>
                          <p className="mt-2 text-xs font-black text-[#0F172A] sm:mt-3 sm:text-sm">{title}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3 sm:p-4">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <p className="mt-2 text-xs font-black text-[#0F172A] sm:mt-3 sm:text-sm">Simple ROI</p>
                      <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">Package stays flat.</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
                      <Rocket className="h-6 w-6 text-emerald-700" />
                      <p className="mt-2 text-xs font-black text-[#0F172A] sm:mt-3 sm:text-sm">Compounding</p>
                      <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">ROI gets reinvested.</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 sm:p-4">
                      <Trophy className="h-6 w-6 text-amber-600" />
                      <p className="mt-2 text-xs font-black text-[#0F172A] sm:mt-3 sm:text-sm">Extra gain</p>
                      <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">Created by growth on growth.</p>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key={`report-${months}-${Math.round(modelAmount)}-${customRatePct ?? "current"}`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4"
                >
                  <div className="rounded-3xl border border-slate-200/70 bg-white p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#64748B]">Your Future Value</p>
                        <p className="mt-1 text-3xl font-black tracking-tight text-emerald-700 sm:mt-2 sm:text-4xl">{fmt(report.compoundPackage)}</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-[#64748B] sm:mt-2 sm:text-sm">
                          Total value after <span className="font-black text-[#0F172A]">{selectedPeriod.toLowerCase()}</span>
                          <br />
                          from {fmt(modelAmount)} invested today
                        </p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-emerald-50 px-2 py-1.5 text-xs font-black text-emerald-700 sm:px-3 sm:py-2 sm:text-sm">
                        +{fmt(report.extra)} Extra Gain
                      </span>
                    </div>

                    <div className="mt-2 h-32 overflow-hidden rounded-3xl bg-gradient-to-b from-white to-emerald-50/40 p-2 sm:mt-3 sm:h-40 sm:p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="modalCompoundArea" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="modalSimpleArea" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.16} />
                              <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#E2E8F0" strokeDasharray="4 8" vertical={false} />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#64748B", fontSize: 10, fontWeight: 800 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Tooltip
                            formatter={(value: number, name) => [
                              fmt(Number(value)),
                              name === "compound" ? "Compounding" : "Simple ROI",
                            ]}
                            contentStyle={{
                              border: "1px solid #E2E8F0",
                              borderRadius: 14,
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
                            fill="url(#modalSimpleArea)"
                            dot={false}
                            activeDot={{ r: 4, fill: "#94A3B8", stroke: "#FFFFFF", strokeWidth: 2 }}
                          />
                          <Area
                            type="monotone"
                            dataKey="compound"
                            stroke="#059669"
                            strokeWidth={3}
                            fill="url(#modalCompoundArea)"
                            dot={{ r: 3, fill: "#059669", stroke: "#ECFDF5", strokeWidth: 3 }}
                            activeDot={{ r: 5, fill: "#059669", stroke: "#ECFDF5", strokeWidth: 3 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-2.5 sm:p-3">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Simple ROI</p>
                          <p className="mt-1 truncate text-sm font-black text-[#0F172A] sm:text-xl">{fmt(simpleTotalValue)}</p>
                          <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">Total value</p>
                        </div>
                        <span className="hidden h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-600 sm:grid">
                          <BarChart3 className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-emerald-500 bg-emerald-50/70 p-2.5 sm:p-3">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">With Compounding</p>
                          <p className="mt-1 truncate text-sm font-black text-emerald-700 sm:text-xl">{fmt(report.compoundPackage)}</p>
                          <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">Total value</p>
                        </div>
                        <span className="hidden h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 sm:grid">
                          <Rocket className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-2.5 sm:p-3">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#64748B]">Extra Gain</p>
                          <p className="mt-1 truncate text-sm font-black text-amber-600 sm:text-xl">+{fmt(report.extra)}</p>
                          <p className="mt-1 hidden text-xs font-semibold text-[#64748B] sm:block">Wealth created</p>
                        </div>
                        <span className="hidden h-10 w-10 place-items-center rounded-full bg-amber-100 text-amber-600 sm:grid">
                          <Trophy className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-2.5 sm:mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-[#0F172A]">Timeline</p>
                      <p className="text-[10px] font-bold text-[#64748B]">Tap to recalculate</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {valueOptions.map(({ label, months: optionMonths, snapshot }) => (
                        <button
                          key={optionMonths}
                          type="button"
                          onClick={() => selectPeriod(optionMonths)}
                          className={`rounded-xl border px-2 py-2 text-center transition ${
                            months === optionMonths
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-transparent bg-slate-50 text-[#64748B] hover:bg-slate-100"
                          }`}
                        >
                          <span className="block text-xs font-black">{label}</span>
                          <span className="mt-1 block truncate text-[10px] font-bold">{fmt(snapshot.compoundPackage)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto hidden gap-2 pt-2 lg:grid lg:grid-cols-[1fr_auto] lg:gap-3 lg:pt-3">
                    <Button className="h-10 rounded-xl bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700" onClick={handleToggle} disabled={enabling}>
                      {enabling ? "Updating..." : compoundingEnabled ? "Disable Compounding" : "Enable Compounding"}
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white px-8 text-sm font-black text-[#0F172A] hover:bg-slate-50" onClick={closeModal}>
                      Close
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
          <Button
            className={`h-11 w-full rounded-xl text-sm font-black text-white ${
              compoundingEnabled ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
            onClick={handleToggle}
            disabled={enabling}
          >
            {enabling ? "Updating..." : compoundingEnabled ? "Disable Compounding" : "Enable Compounding"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
