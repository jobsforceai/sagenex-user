"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, MessageCircle, SendHorizontal, UserRound } from "lucide-react";
import { getCompoundingStatus, toggleCompounding } from "@/actions/user";
import { getNewTieredROIRate, getTieredROIRate, getLegacyTieredROIRate } from "@/lib/roi";
import { toast } from "sonner";

interface Snapshot {
  month: number;
  simpleEarnings: number;
  compoundEarnings: number;
  compoundPackage: number;
  extra: number;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}

const SNAPSHOT_MONTHS = [12, 24, 36];
const PERIOD_OPTIONS = [
  { label: "1 Year", months: 12 },
  { label: "2 Years", months: 24 },
  { label: "3 Years", months: 36 },
] as const;

function buildProjection(packageUSD: number, monthlyRateFn: (pkg: number) => number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let compoundPkg = packageUSD;
  let totalSimple = 0;
  let totalCompound = 0;
  const maxMonths = Math.max(...SNAPSHOT_MONTHS);
  for (let m = 1; m <= maxMonths; m++) {
    const simpleEarning = packageUSD * monthlyRateFn(packageUSD);
    const compoundEarning = compoundPkg * monthlyRateFn(compoundPkg);
    totalSimple += simpleEarning;
    totalCompound += compoundEarning;
    compoundPkg += compoundEarning;
    if (SNAPSHOT_MONTHS.includes(m)) {
      snapshots.push({
        month: m,
        simpleEarnings: totalSimple,
        compoundEarnings: totalCompound,
        compoundPackage: compoundPkg,
        extra: totalCompound - totalSimple,
      });
    }
  }
  return snapshots;
}

function buildSnapshot(packageUSD: number, monthlyRateFn: (pkg: number) => number, months: number): Snapshot {
  let compoundPkg = packageUSD;
  let totalSimple = 0;
  let totalCompound = 0;

  for (let m = 1; m <= months; m++) {
    const simpleEarning = packageUSD * monthlyRateFn(packageUSD);
    const compoundEarning = compoundPkg * monthlyRateFn(compoundPkg);
    totalSimple += simpleEarning;
    totalCompound += compoundEarning;
    compoundPkg += compoundEarning;
  }

  return {
    month: months,
    simpleEarnings: totalSimple,
    compoundEarnings: totalCompound,
    compoundPackage: compoundPkg,
    extra: totalCompound - totalSimple,
  };
}

const fmt = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

interface CompoundingProjectionModalProps {
  manualOpen?: boolean;
  onManualClose?: () => void;
  onCompoundingChange?: (enabled: boolean) => void;
}

export function CompoundingProjectionModal({ manualOpen, onManualClose, onCompoundingChange }: CompoundingProjectionModalProps = {}) {
  const [open, setOpen] = useState(false);
  const [packageUSD, setPackageUSD] = useState(0);
  const [compoundingEnabled, setCompoundingEnabled] = useState(false);
  const [roiPlanType, setRoiPlanType] = useState<"old" | "new" | undefined>(undefined);
  const [roiRate, setRoiRate] = useState(0);
  const [enabling, setEnabling] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [showExplanation, setShowExplanation] = useState(false);
  const [inputValue, setInputValue] = useState("Show me 1 Year");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");

  // Auto-open once on mount for active-package users (first-time pitch)
  useEffect(() => {
    if (manualOpen) return; // don't auto-open if parent is controlling
    getCompoundingStatus().then((res) => {
      if (!res?.error && res?.isPackageActive && (res?.packageUSD ?? 0) > 0) {
        setPackageUSD(res.packageUSD);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType ?? undefined);
        setRoiRate(res.roiRate ?? 0);
        setOpen(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // External (manual) open: refetch status + open
  useEffect(() => {
    if (!manualOpen) return;
    getCompoundingStatus().then((res) => {
      if (!res?.error) {
        setPackageUSD(res.packageUSD ?? 0);
        setCompoundingEnabled(res.compoundingEnabled ?? false);
        setRoiPlanType(res.roiPlanType ?? undefined);
        setRoiRate(res.roiRate ?? 0);
        setOpen(true);
      }
    });
  }, [manualOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onManualClose?.();
  };

  // Headline rate is the authoritative value from the backend (it alone knows
  // the user's plan-start date → legacy vs current table). For the multi-year
  // projection we still need a rate-as-package-grows function, so pick the tier
  // table that matches the backend rate at the current package.
  const rateFn =
    roiPlanType === "new"
      ? getNewTieredROIRate
      : Math.abs(getLegacyTieredROIRate(packageUSD) - roiRate) < 1e-9
        ? getLegacyTieredROIRate
        : getTieredROIRate;
  const monthlyRate = roiRate;
  const monthlyEarning = packageUSD * monthlyRate;
  const snapshots = buildProjection(packageUSD, rateFn);
  const selectedSnapshot = buildSnapshot(packageUSD, rateFn, selectedMonths);
  const selectedPeriod = PERIOD_OPTIONS.find((option) => option.months === selectedMonths)?.label ?? `${selectedMonths} Months`;

  const buildProjectionResponse = (months: number) => {
    const period = PERIOD_OPTIONS.find((option) => option.months === months)?.label ?? `${months} Months`;
    const snapshot = buildSnapshot(packageUSD, rateFn, months);
    return `For ${period}: simple ROI is ${fmt(snapshot.simpleEarnings)}, while compounding becomes ${fmt(snapshot.compoundEarnings)}. Your package can grow to ${fmt(snapshot.compoundPackage)}, which is ${fmt(snapshot.extra)} extra compared with simple ROI.`;
  };

  const buildExplanationResponse = () =>
    `Simple ROI sends your monthly ROI to available balance and keeps your package at ${fmt(packageUSD)}. Compounding adds each monthly ROI back to your package, so the next month earns from a bigger base.`;

  const appendExchange = (message: string, response: string) => {
    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      role: "user",
      text: message,
    };
    const botMessage: ChatMessage = {
      id: `bot-${timestamp}`,
      role: "bot",
      text: response,
    };

    setChatMessages((messages) => [...messages, userMessage, botMessage]);
    setTypingMessageId(botMessage.id);
    setResponseText(response);
  };

  useEffect(() => {
    if (open && chatMessages.length === 0) {
      const message = "Show me 1 Year";
      const response = buildProjectionResponse(12);
      const botMessageId = `bot-initial-${Date.now()}`;
      setChatMessages([
        {
          id: "bot-intro",
          role: "bot",
          text: "I can calculate compounding for your current package. Choose a time period below.",
        },
        {
          id: "user-initial",
          role: "user",
          text: message,
        },
        {
          id: botMessageId,
          role: "bot",
          text: response,
        },
      ]);
      setTypingMessageId(botMessageId);
      setResponseText(response);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chatMessages.length, packageUSD, monthlyRate]);

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
      if (index >= responseText.length) {
        window.clearInterval(timer);
      }
    }, 12);

    return () => window.clearInterval(timer);
  }, [responseText]);

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

  const selectProjection = (months: number) => {
    setSelectedMonths(months);
    setShowExplanation(false);
    const label = PERIOD_OPTIONS.find((option) => option.months === months)?.label ?? `${months} Months`;
    const message = `Show me ${label}`;
    setInputValue(message);
    appendExchange(message, buildProjectionResponse(months));
  };

  const handlePrompt = (message: string) => {
    setInputValue(message);
    if (/how|work|explain/i.test(message)) {
      setShowExplanation(true);
      appendExchange(message, buildExplanationResponse());
      return;
    }

    const match = PERIOD_OPTIONS.find((option) => message.includes(option.label));
    if (match) {
      setSelectedMonths(match.months);
      setShowExplanation(false);
      appendExchange(message, buildProjectionResponse(match.months));
    }
  };

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = inputValue.trim();
    if (!message) return;

    const normalized = message.toLowerCase();

    if (normalized.includes("how") || normalized.includes("work") || normalized.includes("explain")) {
      setShowExplanation(true);
      appendExchange(message, buildExplanationResponse());
      return;
    }

    const months =
      normalized.includes("3") || normalized.includes("three")
        ? 36
        : normalized.includes("2") || normalized.includes("two")
          ? 24
          : normalized.includes("1") || normalized.includes("one")
            ? 12
            : null;

    if (months) {
      setSelectedMonths(months);
      setShowExplanation(false);
      appendExchange(message, buildProjectionResponse(months));
      return;
    }

    appendExchange(
      message,
      "I can calculate only 1 Year, 2 Years, 3 Years, or explain how compounding works. Try one of the quick prompts below."
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-slate-200/70 bg-white p-0 text-[#0F172A] shadow-[0_25px_80px_rgba(15,23,42,0.18)] sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 border-b border-slate-200/70 px-5 py-4 text-lg font-black tracking-tight text-[#0F172A] sm:px-7">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
            Compounding Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-0 md:grid-cols-[minmax(0,0.78fr)_minmax(360px,1.22fr)]">
          <div className="flex min-h-[420px] flex-col bg-slate-50/70">
            <div className="border-b border-slate-200/70 bg-white px-4 py-3 sm:px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#94A3B8]">Guided Chat</p>
              <p className="mt-0.5 text-xs font-semibold text-[#64748B]">Send a supported prompt or tap a quick option.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
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
            </div>

            <div className="border-t border-slate-200/70 bg-white px-4 py-3 sm:px-5">
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.months}
                    type="button"
                    onClick={() => handlePrompt(`Show me ${option.label}`)}
                    className={`rounded-full px-3 py-2 text-xs font-black transition ${
                      !showExplanation && selectedMonths === option.months
                        ? "bg-[#C8103E] text-white shadow-[0_8px_18px_rgba(200,16,62,0.22)]"
                        : "bg-slate-100 text-[#0F172A] hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handlePrompt("Explain compounding")}
                  className={`rounded-full px-3 py-2 text-xs font-black transition ${
                    showExplanation
                      ? "bg-emerald-600 text-white shadow-[0_8px_18px_rgba(5,150,105,0.22)]"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  How it works
                </button>
              </div>
              <form onSubmit={handleSend} className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2">
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-2 text-xs font-semibold text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  placeholder="Try: Show me 2 Years"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#C8103E] px-3 text-[10px] font-black text-white transition hover:bg-[#A50D33]"
                >
                  Send
                  <SendHorizontal className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>

          <aside className="space-y-4 border-t border-slate-200/70 p-5 md:border-l md:border-t-0 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Your Package</p>
                <p className="mt-2 text-3xl font-black text-[#0F172A]">{fmt(packageUSD)}</p>
                <p className="mt-1 text-xs text-[#64748B]">
                  {(monthlyRate * 100).toFixed(0)}% / month →{" "}
                  <span className="font-bold text-emerald-700">{fmt(monthlyEarning)} / month</span>
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Status</p>
                <span className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${
                  compoundingEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {compoundingEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-[#C8103E]/15 bg-[#FFF1F4] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#A50D33]">{selectedPeriod} Result</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#C8103E]">
                  +{fmt(selectedSnapshot.extra)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-[#94A3B8]">Simple ROI</p>
                  <p className="mt-1 text-xl font-black text-[#0F172A]">{fmt(selectedSnapshot.simpleEarnings)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Compounding</p>
                  <p className="mt-1 text-xl font-black text-emerald-700">{fmt(selectedSnapshot.compoundEarnings)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-[#64748B]">
                Projected package: <span className="font-black text-[#0F172A]">{fmt(selectedSnapshot.compoundPackage)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#64748B]">Projection Cards</p>
              <div className="grid gap-2">
                {snapshots.map((s) => (
                  <button
                    key={s.month}
                    type="button"
                    onClick={() => selectProjection(s.month)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      !showExplanation && selectedMonths === s.month
                        ? "border-[#C8103E]/30 bg-[#FFF1F4]"
                        : "border-slate-200/70 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#0F172A]">
                        {s.month === 12 ? "1 Year" : s.month === 24 ? "2 Years" : "3 Years"}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                        +{fmt(s.extra)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Package grows to <span className="font-bold text-[#0F172A]">{fmt(s.compoundPackage)}</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {compoundingEnabled ? (
                <Button
                  className="h-11 rounded-xl bg-rose-600 font-bold text-white shadow-[0_10px_30px_rgba(225,29,72,0.25)] hover:bg-rose-700"
                  onClick={handleToggle}
                  disabled={enabling}
                >
                  {enabling ? "Disabling..." : "Disable Compounding"}
                </Button>
              ) : (
                <Button
                  className="h-11 rounded-xl bg-emerald-600 font-bold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700"
                  onClick={handleToggle}
                  disabled={enabling}
                >
                  {enabling ? "Enabling..." : "Enable Compounding"}
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 rounded-xl border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                {compoundingEnabled ? "Close" : "Maybe Later"}
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
