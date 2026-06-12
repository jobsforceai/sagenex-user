"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, Check, CheckCircle2, MessageCircle, SendHorizontal, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getCompoundingStatus, toggleCompounding } from "@/actions/user";
import { getLegacyTieredROIRate, getNewTieredROIRate, getTieredROIRate } from "@/lib/roi";
import { toast } from "sonner";

type ChatRole = "bot" | "user";
type ChatStep = 0 | 1 | 2;

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

const fmt = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

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

const parseRate = (value: string) => {
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const rate = Number(match[1]);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

const parseMonths = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("3") || normalized.includes("three")) return 36;
  if (normalized.includes("2") || normalized.includes("two")) return 24;
  if (normalized.includes("1") || normalized.includes("one")) return 12;
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
  const [months, setMonths] = useState(12);
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
  const rateFn = customRatePct === null ? baseRateFn : () => effectiveRate;
  const selectedPeriod = PERIODS.find((period) => period.months === months)?.label ?? `${months} Months`;
  const monthlyEarning = modelAmount * effectiveRate;
  const report = useMemo(
    () => buildSnapshot(modelAmount, rateFn, months),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelAmount, months, customRatePct, roiRate, roiPlanType, packageAmount]
  );
  const previews = useMemo(
    () => PERIODS.map((period) => ({ ...period, snapshot: buildSnapshot(modelAmount, rateFn, period.months) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modelAmount, customRatePct, roiRate, roiPlanType, packageAmount]
  );

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
    window.setTimeout(() => {
      appendBot(`Let's build your compounding projection. First, confirm the starting amount. Your current package is ${fmt(amount)}.`);
    }, 80);
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
  }, [chatMessages, displayedResponse]);

  useEffect(() => {
    if (!isBuilding) return;
    setBuildProgress(8);
    const values = [25, 50, 75, 100];
    let index = 0;
    const timer = window.setInterval(() => {
      setBuildProgress(values[index]);
      index += 1;
      if (index >= values.length) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          setIsBuilding(false);
          setChatStep(2);
          sendBot(`Report is ready. Compounding gives ${fmt(report.extra)} extra over ${selectedPeriod}.`);
        }, 360);
      }
    }, 430);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBuilding]);

  const processMessage = (message: string) => {
    const normalized = message.toLowerCase();

    if (chatStep === 0) {
      const amount = normalized.includes("current") ? packageAmount : parseAmount(message);
      if (!amount) {
        sendBot("Please send a starting amount like ₹1,00,000, 1 lakh, or type current package.");
        return;
      }
      setModelAmount(amount);
      setChatStep(1);
      setInputValue(`${Math.round(effectiveRate * 100)}% and ${selectedPeriod}`);
      sendBot(`Starting amount locked at ${fmt(amount)}. Step 2 is now open. Send ROI and duration, like 7% for 2 years.`);
      return;
    }

    if (chatStep === 1) {
      const rate = parseRate(message);
      const nextMonths = parseMonths(message);
      if (rate) setCustomRatePct(rate);
      if (nextMonths) setMonths(nextMonths);
      if (!rate && !nextMonths) {
        sendBot("For Step 2, send ROI and duration. Example: 7% for 2 years.");
        return;
      }
      if (!nextMonths) {
        sendBot(`ROI set to ${rate}%. Now send duration: 1 year, 2 years, or 3 years.`);
        return;
      }
      setIsBuilding(true);
      setInputValue("Explain compounding");
      sendBot("Great. I am building your projection now.");
      return;
    }

    if (normalized.includes("explain") || normalized.includes("how")) {
      sendBot(`Simple ROI pays out monthly. Compounding adds the ROI back to your package, so the next month earns from a larger amount.`);
      return;
    }

    sendBot("Your report is ready on the right. You can change inputs by sending a new amount or selecting a quick action.");
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

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onManualClose?.();
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
        setOpen(false);
      }
    } catch {
      toast.error(compoundingEnabled ? "Failed to disable compounding." : "Failed to enable compounding.");
    } finally {
      setEnabling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[min(92vh,760px)] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-0 text-[#0F172A] shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="border-b border-slate-200/70 px-5 py-4 sm:px-7">
            <span className="flex items-center gap-2 text-lg font-black">
              <MessageCircle className="h-5 w-5 text-[#C8103E]" />
              Compounding Calculator
            </span>
            <span className="mt-1 block text-sm font-semibold text-[#64748B]">Real numbers. Real freedom.</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,1.22fr)]">
          <section className="flex min-h-0 flex-col border-b border-slate-200/70 bg-slate-50/70 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200/70 bg-white px-4 py-4 sm:px-5">
              <div className="grid grid-cols-3 gap-2">
                {STEPS.map((step, index) => (
                  <div key={step.label} className="min-w-0">
                    <div className={`h-1.5 rounded-full ${index <= chatStep ? "bg-[#C8103E]" : "bg-slate-200"}`} />
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black ${
                        index < chatStep
                          ? "bg-emerald-600 text-white"
                          : index === chatStep
                            ? "bg-[#C8103E] text-white"
                            : "bg-slate-100 text-[#94A3B8]"
                      }`}>
                        {index < chatStep ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="truncate text-[10px] font-black uppercase tracking-[0.08em] text-[#64748B]">
                        {step.label} · {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {chatMessages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="flex max-w-[88%] items-center gap-2 rounded-2xl rounded-tr-md bg-[#C8103E] px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_10px_24px_rgba(200,16,62,0.2)]">
                      <UserRound className="h-3.5 w-3.5" />
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex items-start gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-3.5 py-2.5 text-xs leading-relaxed shadow-sm">
                      {message.id === typingMessageId ? displayedResponse : message.text}
                      {message.id === typingMessageId && displayedResponse.length < responseText.length && (
                        <span className="ml-0.5 inline-block h-3 w-1 animate-pulse rounded-full bg-emerald-500 align-middle" />
                      )}
                    </div>
                  </div>
                )
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-slate-200/70 bg-white px-4 py-3 sm:px-5">
              <div className="mb-2 flex flex-wrap gap-2">
                {chatStep === 0 ? (
                  <>
                    <button type="button" onClick={() => quickSend("Use current package")} className="rounded-full bg-[#FFF1F4] px-3 py-2 text-xs font-black text-[#C8103E]">Current package</button>
                    <button type="button" onClick={() => quickSend("₹1,00,000")} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-[#0F172A]">₹1,00,000</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => quickSend("7% for 2 years")} className="rounded-full bg-[#FFF1F4] px-3 py-2 text-xs font-black text-[#C8103E]">7% · 2 yrs</button>
                    <button type="button" onClick={() => quickSend("10% for 3 years")} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-[#0F172A]">10% · 3 yrs</button>
                    <button type="button" onClick={() => quickSend("Explain compounding")} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Explain</button>
                  </>
                )}
              </div>
              <form onSubmit={handleSend} className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2">
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  placeholder={chatStep === 0 ? "Enter amount" : "Enter ROI and duration"}
                />
                <button type="submit" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#C8103E] px-3 text-[10px] font-black text-white hover:bg-[#A50D33]">
                  Send
                  <SendHorizontal className="h-3 w-3" />
                </button>
              </form>
            </div>
          </section>

          <aside className="min-h-0 space-y-3 overflow-hidden p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Starting Amount</p>
                <p className="mt-2 text-3xl font-black text-[#0F172A]">{fmt(modelAmount)}</p>
                <p className="mt-1 text-xs text-[#64748B]">Actual package: {fmt(packageAmount)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Status</p>
                <span className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
                  compoundingEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {compoundingEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Monthly ROI</p>
                <p className="mt-1 text-xl font-black text-[#0F172A]">{(effectiveRate * 100).toFixed(0)}%</p>
                <p className="mt-1 text-xs text-[#64748B]">{fmt(monthlyEarning)} / month</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Duration</p>
                <p className="mt-1 text-xl font-black text-[#0F172A]">{selectedPeriod}</p>
                <p className="mt-1 text-xs text-[#64748B]">Monthly compounding</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Extra</p>
                <p className="mt-1 text-xl font-black text-emerald-700">{fmt(report.extra)}</p>
                <p className="mt-1 text-xs text-[#64748B]">vs simple ROI</p>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {isBuilding ? (
                <motion.div
                  key="building"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-3xl border border-slate-200/70 bg-white p-4 text-center shadow-sm"
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
                  <h3 className="mt-3 text-lg font-black text-[#0F172A]">Building your projection</h3>
                  <p className="mx-auto mt-1 max-w-sm text-xs font-semibold text-[#64748B]">Running monthly compounding across your time horizon.</p>
                  <div className="mx-auto mt-4 grid max-w-md gap-2 text-left sm:grid-cols-2">
                    {[
                      ["Securing your inputs", buildProgress >= 25],
                      ["Modelling monthly compounding", buildProgress >= 50],
                      ["Projecting growth curve", buildProgress >= 75],
                      ["Composing your report", buildProgress >= 100],
                    ].map(([label, done], index) => (
                      <div key={String(label)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-2.5 py-2">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black ${done ? "bg-emerald-500 text-white" : "bg-slate-100 text-[#94A3B8]"}`}>
                          {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </span>
                        <span className={`text-xs font-bold ${done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`report-${months}-${Math.round(modelAmount)}-${customRatePct ?? "current"}`}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-3xl border border-[#C8103E]/15 bg-[#FFF1F4] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#A50D33]">Report</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#C8103E]">+{fmt(report.extra)}</span>
                  </div>
                  <p className="mt-1 text-sm font-black text-[#0F172A]">{selectedPeriod} Projection</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Simple ROI</p>
                      <p className="mt-1 text-xl font-black text-[#0F172A]">{fmt(report.simpleEarnings)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Compounding</p>
                      <p className="mt-1 text-xl font-black text-emerald-700">{fmt(report.compoundEarnings)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-[#64748B]">
                    Projected package: <span className="font-black text-[#0F172A]">{fmt(report.compoundPackage)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid gap-2 sm:grid-cols-3">
              {previews.map(({ label, months: optionMonths, snapshot }) => (
                <button
                  key={optionMonths}
                  type="button"
                  onClick={() => {
                    appendUser(`Show me ${label}`);
                    setMonths(optionMonths);
                    setIsBuilding(true);
                    sendBot("Building that projection now.");
                  }}
                  className={`rounded-2xl border p-3 text-left ${months === optionMonths ? "border-[#C8103E]/30 bg-[#FFF1F4]" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                >
                  <p className="text-xs font-black text-[#0F172A]">{label}</p>
                  <p className="mt-1 text-[10px] font-black text-emerald-700">+{fmt(snapshot.extra)}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Button className={`h-11 rounded-xl font-bold text-white ${compoundingEnabled ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`} onClick={handleToggle} disabled={enabling}>
                {enabling ? "Updating..." : compoundingEnabled ? "Disable Compounding" : "Enable Compounding"}
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white px-6 font-bold text-[#0F172A] hover:bg-slate-50" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
