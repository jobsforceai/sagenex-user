"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getPayouts, getCurrentPayoutProgress } from "@/actions/user";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Gift,
  HelpCircle,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

interface Payout {
  month: string;
  packageUSD: number;
  roiPayout: number;
  directReferralBonus: number;
  unilevelBonus: number;
  salary: number;
  totalMonthlyIncome: number;
}

interface CurrentPayout {
  nextPayoutDate: string | null;
  estimatedPayout: number;
  earningsCapTotal?: number;
  earnedSinceBaseline?: number;
  remainingEarningsCap?: number;
  roiRate?: number;
  isCapReached?: boolean;
  potentialRoiPerCycle?: number;
  maxRemainingRoiPayouts?: number;
  estimatedCapDate?: string | null;
  earningsBreakdown: {
    roiPayout: number;
    directReferralBonus: number;
    unilevelBonus: number;
    salary: number;
  };
  error?: string;
}

interface PayoutHistoryResponse {
  payouts: Payout[];
  pagination: {
    currentPage: number;
    totalPages: number;
  };
  error?: string;
}

type NextPayoutStatus = "not_started" | "active" | "completed";

const payoutAssets = {
  hero: "/payouts/hero-pink-wallet-coins.png",
  totalEarnings: "/payouts/total-earnings-money-stack.png",
  totalBonuses: "/payouts/total-bonuses-gift.png",
  totalPaidOut: "/payouts/total-paid-out-wallet.png",
  calendar: "/payouts/calendar-payout-date.png",
  roiChart: "/payouts/roi-projection-chart.png",
  secure: "/payouts/secure-verified-shield.png",
  timely: "/payouts/timely-payout-clock.png",
  medal: "/payouts/reward-medal.png",
  track: "/payouts/track-grow-chart.png",
} as const;

const formatCurrency = (amount: number, currency = "INR") =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCompactCurrency = (amount: number) =>
  amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const getPayoutStatus = (currentPayout: CurrentPayout | null, progressPercent: number): NextPayoutStatus => {
  if (currentPayout?.isCapReached || progressPercent >= 100) return "completed";
  if (currentPayout?.nextPayoutDate) return "active";
  return "not_started";
};

const getMonthLabel = (month: string) => {
  const normalized = month.length === 7 ? `${month}-01` : month;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const PayoutHeader = ({ onInfoClick }: { onInfoClick: () => void }) => (
  <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl">Payouts</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B] sm:text-base">
          Track your earnings, bonuses and review your payout history.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:pr-48">
        <Button
          type="button"
          variant="outline"
          onClick={onInfoClick}
          className="h-12 rounded-xl border-slate-200 bg-white px-4 font-bold text-[#0F172A] shadow-[0_10px_30px_rgba(15,23,42,0.05)] hover:bg-slate-50"
        >
          <Info className="mr-2 h-4 w-4 text-amber-500" />
          Payout Rules & Info
        </Button>
      </div>
    </div>
    <Image
      src={payoutAssets.hero}
      alt="Payout wallet with coins"
      width={240}
      height={240}
      priority
      className="pointer-events-none absolute -right-3 -top-8 hidden h-56 w-56 object-contain drop-shadow-2xl lg:block"
    />
  </header>
);

const PayoutMetricCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) => (
  <div className="rounded-2xl border border-white/14 bg-white/12 p-4 backdrop-blur">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.12em] text-white/62">{title}</p>
        <p className="mt-2 text-xl font-black text-white sm:text-2xl">{value}</p>
        <p className="wallet-red-muted mt-1 text-xs font-semibold text-white/62">{subtitle}</p>
      </div>
      <Image src={icon} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
    </div>
  </div>
);

const PayoutHeroCard = ({
  currentEstimatedPayout,
  totalEarnings,
  totalBonuses,
  totalPaidOut,
}: {
  currentEstimatedPayout: number;
  totalEarnings: number;
  totalBonuses: number;
  totalPaidOut: number;
}) => (
  <section className="wallet-red-surface relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_55%,#35000D_100%)] p-6 text-white shadow-[0_24px_70px_rgba(122,0,31,0.25)] sm:p-8">
    <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_0)] [background-size:24px_24px]" />
    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#F59E0B]/25 blur-3xl" />
    <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_140px] lg:items-start">
      <div>
        <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.18em] text-white/70">
          Current Estimated Payout
        </p>
        <h2 className="mt-3 text-4xl font-black leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
          {formatCurrency(currentEstimatedPayout)}
        </h2>
        <p className="wallet-red-soft mt-3 text-sm font-semibold text-white/82">
          Total estimated amount ready for payout
        </p>
      </div>
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/14 bg-white/12 backdrop-blur lg:justify-self-end">
        <span className="text-5xl font-black text-white">₹</span>
      </div>
    </div>
    <div className="relative mt-7 grid gap-4 md:grid-cols-3">
      <PayoutMetricCard
        title="Total Earnings"
        value={formatCompactCurrency(totalEarnings)}
        subtitle="All time earnings"
        icon={payoutAssets.totalEarnings}
      />
      <PayoutMetricCard
        title="Total Bonuses"
        value={formatCompactCurrency(totalBonuses)}
        subtitle="Includes special bonuses"
        icon={payoutAssets.totalBonuses}
      />
      <PayoutMetricCard
        title="Total Paid Out"
        value={formatCompactCurrency(totalPaidOut)}
        subtitle="Total amount paid"
        icon={payoutAssets.totalPaidOut}
      />
    </div>
  </section>
);

const ProgressRing = ({ percent, status }: { percent: number; status: NextPayoutStatus }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = status === "completed" ? "#059669" : status === "active" ? "#10B981" : "#CBD5E1";

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Image src={payoutAssets.calendar} alt="" width={76} height={76} className="h-20 w-20 object-contain" />
      </div>
    </div>
  );
};

const NextPayoutCountdownCard = ({
  status,
  countdown,
  estimatedDate,
  progressPercent,
  isCapReached,
}: {
  status: NextPayoutStatus;
  countdown: string | null;
  estimatedDate: string | null;
  progressPercent: number;
  isCapReached?: boolean;
}) => {
  const statusLabel = status === "not_started" ? "Not started" : status === "active" ? "Active" : "Completed";
  const statusClass =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "active"
        ? "bg-[#ECFDF5] text-emerald-700"
        : "bg-slate-100 text-slate-500";

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:grid-cols-[190px_minmax(0,1fr)] md:items-center sm:p-6">
      <div className="flex justify-center">
        <ProgressRing percent={progressPercent} status={status} />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#64748B]">
            Next Payout Countdown
          </p>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{statusLabel}</span>
        </div>
        <h3 className="mt-3 text-3xl font-black text-[#0F172A]">{countdown || "Not started"}</h3>
        <p className="mt-2 text-sm text-[#64748B]">
          Estimated payout date: <span className="font-bold text-[#0F172A]">{estimatedDate || "N/A"}</span>
        </p>
        {isCapReached && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            ROI stopped, reinvest to continue.
            <Link href="/wallet" className="ml-2 underline">
              Reinvest now
            </Link>
          </div>
        )}
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${status === "not_started" ? "bg-slate-300" : "bg-emerald-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#64748B]">{progressPercent.toFixed(1)}% of current cycle completed</p>
          <p className="text-xs text-[#64748B]">
            You will receive your next payout once this countdown ends and the progress bar completes.
          </p>
        </div>
      </div>
    </section>
  );
};

const EarningsBreakdownCard = ({
  rows,
  total,
}: {
  rows: { label: string; amount: number; type: string }[];
  total: number;
}) => (
  <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="flex items-center gap-3">
      <Image src={payoutAssets.totalEarnings} alt="" width={46} height={46} className="h-12 w-12 object-contain" />
      <div>
        <h2 className="text-lg font-black uppercase tracking-[0.06em] text-[#0F172A]">Current Earnings Breakdown</h2>
        <p className="text-sm text-[#64748B]">Current cycle payout components</p>
      </div>
    </div>
    <div className="mt-5 space-y-2">
      {rows.filter((row) => row.amount > 0).length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-[#64748B]">
          No earnings recorded for this cycle yet.
        </p>
      ) : (
        rows
          .filter((row) => row.amount > 0)
          .map((row) => (
            <div key={row.type} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm font-bold text-[#64748B]">{row.label}</span>
              <span className="text-sm font-black text-[#0F172A]">{formatCurrency(row.amount)}</span>
            </div>
          ))
      )}
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <span className="text-sm font-black uppercase tracking-[0.12em] text-[#64748B]">Total</span>
      <span className="text-xl font-black text-emerald-600">{formatCurrency(total)}</span>
    </div>
  </section>
);

const ROIProjectionCard = ({
  estimatedPayout,
  roiRate,
  potentialRoiPerCycle,
  remainingEarningsCap,
  estimatedCapDate,
}: {
  estimatedPayout: number;
  roiRate?: number;
  potentialRoiPerCycle?: number;
  remainingEarningsCap?: number;
  estimatedCapDate?: string | null;
}) => (
  <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-violet-100 blur-3xl" />
    <div className="relative flex items-center gap-3">
      <Image src={payoutAssets.roiChart} alt="" width={46} height={46} className="h-12 w-12 object-contain" />
      <div>
        <h2 className="text-lg font-black uppercase tracking-[0.06em] text-[#0F172A]">ROI Projection</h2>
        <p className="text-sm text-[#64748B]">Estimated payout based on current performance</p>
      </div>
    </div>
    <p className="relative mt-5 text-4xl font-black text-[#0F172A]">{formatCurrency(estimatedPayout)}</p>
    <svg className="relative mt-5 h-16 w-full text-violet-500" viewBox="0 0 320 70" fill="none" aria-hidden="true">
      <path d="M4 55C38 22 66 40 94 30C128 18 150 12 184 36C222 63 260 46 316 12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M4 55C38 22 66 40 94 30C128 18 150 12 184 36C222 63 260 46 316 12" stroke="currentColor" strokeOpacity="0.12" strokeWidth="16" strokeLinecap="round" />
    </svg>
    <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
      {[
        roiRate !== undefined ? ["ROI rate", `${(roiRate * 100).toFixed(2)}%`] : null,
        potentialRoiPerCycle !== undefined ? ["Potential per cycle", formatCurrency(potentialRoiPerCycle)] : null,
        remainingEarningsCap !== undefined ? ["Remaining cap", formatCurrency(remainingEarningsCap)] : null,
        estimatedCapDate ? ["Approx cap date", new Date(estimatedCapDate).toLocaleDateString()] : null,
      ]
        .filter(Boolean)
        .map((item) => (
          <div key={item![0]} className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">{item![0]}</p>
            <p className="mt-1 text-sm font-black text-[#0F172A]">{item![1]}</p>
          </div>
        ))}
    </div>
  </section>
);

const statusStyles = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  processing: "bg-violet-50 text-violet-700",
};

const PayoutHistoryCard = ({
  payouts,
  historyLoading,
  lastPayoutElementRef,
}: {
  payouts: Payout[];
  historyLoading: boolean;
  lastPayoutElementRef: (node: HTMLDivElement) => void;
}) => (
  <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5 text-[#C8103E]" />
        <h2 className="text-lg font-black uppercase tracking-[0.06em] text-[#0F172A]">Payout History</h2>
      </div>
      {payouts.length > 6 && (
        <Button variant="outline" className="rounded-xl border-slate-200 bg-white text-sm font-bold text-[#0F172A] hover:bg-slate-50">
          View all
        </Button>
      )}
    </div>
    <div className="mt-5">
      {payouts.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-[#64748B]">No payout history yet.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-3">
          {payouts.map((payout, index) => {
            const status = "paid" as keyof typeof statusStyles;
            return (
              <AccordionItem
                key={payout.month}
                value={payout.month}
                className="rounded-2xl border border-slate-200 bg-white px-4"
                ref={index === payouts.length - 1 ? lastPayoutElementRef : null}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="grid w-full grid-cols-1 gap-3 pr-3 text-left sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-[#0F172A]">{payout.month}</p>
                      <p className="text-sm text-[#64748B]">{getMonthLabel(payout.month)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#64748B]">Payout Amount</p>
                      <p className="mt-1 font-black text-[#0F172A]">{formatCurrency(payout.totalMonthlyIncome)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${statusStyles[status]}`}>
                        {status}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[#64748B]" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                    {[
                      ["Special Bonus Payout", payout.roiPayout],
                      ["Direct Referral Bonus", payout.directReferralBonus],
                      ["Unilevel Bonus", payout.unilevelBonus],
                      ["Salary", payout.salary],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                        <span className="text-sm text-[#64748B]">{label}</span>
                        <span className="text-sm font-black text-[#0F172A]">{formatCurrency(Number(value))}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      {historyLoading && (
        <div className="flex items-center justify-center py-4 text-[#64748B]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading more...</span>
        </div>
      )}
    </div>
  </section>
);

const PayoutBenefitsStrip = () => {
  const items = [
    { icon: payoutAssets.secure, title: "Secure & Verified", text: "100% safe and verified payout system." },
    { icon: payoutAssets.timely, title: "Timely Payouts", text: "Payouts are processed on time every cycle." },
    { icon: payoutAssets.medal, title: "Earn More Rewards", text: "Unlock bonuses and increase your earnings." },
    { icon: payoutAssets.track, title: "Track & Grow", text: "Keep tracking your growth and maximize rewards." },
  ];

  return (
    <section className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
          <Image src={item.icon} alt="" width={52} height={52} className="h-14 w-14 object-contain" />
          <p className="mt-3 font-black text-[#0F172A]">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">{item.text}</p>
        </div>
      ))}
    </section>
  );
};

const PayoutTrustBanner = () => (
  <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-[#ECFDF5] px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
    <Image src={payoutAssets.secure} alt="" width={54} height={54} className="h-14 w-14 object-contain" />
    <div>
      <p className="text-lg font-black text-emerald-700">Fair · Transparent · Rewarding</p>
      <p className="mt-1 text-sm text-emerald-800/80">
        We ensure fair calculations and on-time payouts for all members.
      </p>
    </div>
  </section>
);

const LoadingSkeleton = () => (
  <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-white" />
      <div className="h-72 animate-pulse rounded-3xl bg-white" />
      <div className="h-56 animate-pulse rounded-3xl bg-white" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-3xl bg-white" />
        <div className="h-72 animate-pulse rounded-3xl bg-white" />
      </div>
    </div>
  </div>
);

const PayoutsPage = () => {
  const { token } = useAuth();

  const [currentPayout, setCurrentPayout] = useState<CurrentPayout | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 0, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [nextPayoutFormattedDate, setNextPayoutFormattedDate] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchInitialData = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [currentData, historyData] = await Promise.all([
        getCurrentPayoutProgress(),
        getPayouts(1),
      ]);

      if (currentData.error) setError(currentData.error);
      else setCurrentPayout(currentData);

      if (historyData.error) setError(historyData.error);
      else {
        setPayoutHistory(historyData.payouts);
        setPagination(historyData.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch initial payout data:", err);
      setError("An unexpected error occurred while fetching payout data.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const loadMorePayouts = useCallback(async () => {
    if (historyLoading || pagination.currentPage >= pagination.totalPages) return;

    setHistoryLoading(true);
    const nextPage = pagination.currentPage + 1;
    const data: PayoutHistoryResponse = await getPayouts(nextPage);

    if (data.error) {
      setError(data.error);
    } else {
      setPayoutHistory((prev) => [...prev, ...data.payouts]);
      setPagination(data.pagination);
    }
    setHistoryLoading(false);
  }, [pagination, historyLoading]);

  const lastPayoutElementRef = useCallback((node: HTMLDivElement) => {
    if (historyLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && pagination.currentPage < pagination.totalPages) {
        loadMorePayouts();
      }
    });

    if (node) observer.current.observe(node);
  }, [historyLoading, pagination, loadMorePayouts]);

  useEffect(() => {
    if (!token) return;
    fetchInitialData();
  }, [token, fetchInitialData]);

  useEffect(() => {
    if (!currentPayout?.nextPayoutDate || currentPayout?.isCapReached) {
      setCountdown(currentPayout?.isCapReached ? "ROI stopped" : "Not started");
      setNextPayoutFormattedDate("N/A");
      setProgressPercentage(currentPayout?.isCapReached ? 100 : 0);
      return;
    }

    const nextDate = new Date(currentPayout.nextPayoutDate);
    setNextPayoutFormattedDate(nextDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextDate.getTime() - now.getTime();
      const cycleDurationMs = 30 * 24 * 60 * 60 * 1000;
      const cycleStart = new Date(nextDate.getTime() - cycleDurationMs);
      const elapsedTime = now.getTime() - cycleStart.getTime();

      const calculatedProgress = Math.max(0, Math.min(100, (elapsedTime / cycleDurationMs) * 100));
      setProgressPercentage(calculatedProgress);

      if (diff <= 0) {
        setCountdown("Processing...");
        setProgressPercentage(100);
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPayout]);

  const earningsBreakdownRows = useMemo(() => {
    const breakdown = currentPayout?.earningsBreakdown;
    return [
      { label: "Special Bonus Payout", amount: breakdown?.roiPayout ?? 0, type: "special_bonus" },
      { label: "Direct Referral Bonus", amount: breakdown?.directReferralBonus ?? 0, type: "referral" },
      { label: "Unilevel Bonus", amount: breakdown?.unilevelBonus ?? 0, type: "reward" },
      { label: "Salary", amount: breakdown?.salary ?? 0, type: "salary" },
    ];
  }, [currentPayout]);

  const totals = useMemo(() => {
    const totalPaidOut = payoutHistory.reduce((sum, payout) => sum + (payout.totalMonthlyIncome || 0), 0);
    const historicalBonuses = payoutHistory.reduce(
      (sum, payout) => sum + (payout.directReferralBonus || 0) + (payout.unilevelBonus || 0) + (payout.salary || 0),
      0,
    );
    const currentBonuses = earningsBreakdownRows
      .filter((row) => row.type !== "special_bonus")
      .reduce((sum, row) => sum + row.amount, 0);
    const currentEstimated = currentPayout?.estimatedPayout ?? 0;
    const totalEarnings = totalPaidOut + (currentPayout?.earnedSinceBaseline ?? currentEstimated);

    return {
      currentEstimated,
      totalPaidOut,
      totalBonuses: historicalBonuses + currentBonuses,
      totalEarnings,
      currentBreakdownTotal: earningsBreakdownRows.reduce((sum, row) => sum + row.amount, 0),
    };
  }, [currentPayout, payoutHistory, earningsBreakdownRows]);

  const nextPayoutStatus = getPayoutStatus(currentPayout, progressPercentage);

  if (initialLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="dashboard-light-scope flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <p className="text-lg font-black text-red-700">Unable to load payouts</p>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button onClick={fetchInitialData} className="wallet-red-control mt-5 bg-[#C8103E] text-white hover:bg-[#A90D32]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-light-scope min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PayoutHeader
          onInfoClick={() =>
            setInfoMessage("Payouts are calculated from eligible earnings and released after the current payout cycle completes.")
          }
        />

        {infoMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{infoMessage}</p>
          </div>
        )}

        <PayoutHeroCard
          currentEstimatedPayout={totals.currentEstimated}
          totalEarnings={totals.totalEarnings}
          totalBonuses={totals.totalBonuses}
          totalPaidOut={totals.totalPaidOut}
        />

        <NextPayoutCountdownCard
          status={nextPayoutStatus}
          countdown={countdown}
          estimatedDate={nextPayoutFormattedDate}
          progressPercent={progressPercentage}
          isCapReached={currentPayout?.isCapReached}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          <EarningsBreakdownCard rows={earningsBreakdownRows} total={totals.currentBreakdownTotal} />
          <ROIProjectionCard
            estimatedPayout={currentPayout?.estimatedPayout ?? 0}
            roiRate={currentPayout?.roiRate}
            potentialRoiPerCycle={currentPayout?.potentialRoiPerCycle}
            remainingEarningsCap={currentPayout?.remainingEarningsCap}
            estimatedCapDate={currentPayout?.estimatedCapDate}
          />
        </div>

        <PayoutHistoryCard
          payouts={payoutHistory}
          historyLoading={historyLoading}
          lastPayoutElementRef={lastPayoutElementRef}
        />

        <PayoutBenefitsStrip />
        <PayoutTrustBanner />

        <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-[#64748B]">
            <Sparkles className="h-5 w-5 text-[#C8103E]" />
            <span>Keep tracking your payouts and compounding your growth with SAGENEX.</span>
            <Clock className="h-5 w-5 text-emerald-600" />
            <CalendarDays className="h-5 w-5 text-amber-500" />
            <Gift className="h-5 w-5 text-violet-500" />
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <TrendingUp className="h-5 w-5 text-[#C8103E]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutsPage;
