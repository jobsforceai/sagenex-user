"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPayouts, getCurrentPayoutProgress, getDashboardData } from "@/actions/user";
import { ArrowLeft, DollarSign, CalendarDays, TrendingUp, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- INTERFACES ---
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
}

interface PayoutHistoryResponse {
    payouts: Payout[];
    pagination: {
        currentPage: number;
        totalPages: number;
    };
    error?: string;
}

// --- HELPER COMPONENTS ---
const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
  <Card className="bg-gray-900/50 border-gray-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
    </CardContent>
  </Card>
);

const PayoutDetailRow = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-b-0">
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">{label}</span>
        </div>
        <span className="font-medium text-white">{formatCurrency(value)}</span>
    </div>
);

const formatCurrency = (amount: number) =>
    amount.toLocaleString("en-IN", { style: "currency", currency: "INR" });

// --- MAIN COMPONENT ---
const PayoutsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State for data
  const [currentPayout, setCurrentPayout] = useState<CurrentPayout | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 0, totalPages: 1 });
  
  // State for UI
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [nextPayoutFormattedDate, setNextPayoutFormattedDate] = useState<string | null>(null);
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [profileData, setProfileData] = useState<{ fullName?: string; profilePicture?: string; } | null>(null);
  const [rankData, setRankData] = useState<{ name?: string } | null>(null);
  const [walletData, setWalletData] = useState<{ availableBalance?: number } | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const loadMorePayouts = useCallback(async () => {
    if (historyLoading || pagination.currentPage >= pagination.totalPages) return;

    setHistoryLoading(true);
    const nextPage = pagination.currentPage + 1;
    const data: PayoutHistoryResponse = await getPayouts(nextPage);

    if (data.error) {
        setError(data.error as string);
    } else {
        setPayoutHistory(prev => [...prev, ...data.payouts]);
        setPagination(data.pagination);
    }
    setHistoryLoading(false);
  }, [pagination, historyLoading]);

  const lastPayoutElementRef = useCallback((node: HTMLDivElement) => {
    if (historyLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && pagination.currentPage < pagination.totalPages) {
        loadMorePayouts();
      }
    });

    if (node) observer.current.observe(node);
  }, [historyLoading, pagination, loadMorePayouts]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [currentData, historyData, dashboardData] = await Promise.all([
            getCurrentPayoutProgress(),
            getPayouts(1),
            getDashboardData()
        ]);

        if (currentData.error) setError(currentData.error);
        else setCurrentPayout(currentData);

        if (historyData.error) setError(historyData.error);
        else {
            setPayoutHistory(historyData.payouts);
            setPagination(historyData.pagination);
        }
        
        // Extract profile and rank from dashboard
        if (dashboardData && !dashboardData.error) {
          if (dashboardData.profile) {
            setProfileData(dashboardData.profile);
          }
          if (dashboardData.rank || dashboardData.performanceRank) {
            setRankData(dashboardData.rank || dashboardData.performanceRank);
          }
          if (dashboardData.wallet) {
            setWalletData(dashboardData.wallet);
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial payout data:", err);
        setError("An unexpected error occurred while fetching payout data.");
      } finally {
        setInitialLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!currentPayout?.nextPayoutDate || currentPayout?.isCapReached) {
        setCountdown(currentPayout?.isCapReached ? "ROI stopped" : "Not started");
        setNextPayoutFormattedDate("N/A");
        setProgressPercentage(currentPayout?.isCapReached ? 100 : 0);
        return;
    }

    const nextDate = new Date(currentPayout.nextPayoutDate as string);
    setNextPayoutFormattedDate(nextDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextDate.getTime() - now.getTime();

      // Assuming a 30-day cycle for progress calculation
      const cycleDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      const cycleStart = new Date(nextDate.getTime() - cycleDurationMs);
      const elapsedTime = now.getTime() - cycleStart.getTime();

      let calculatedProgress = (elapsedTime / cycleDurationMs) * 100;
      calculatedProgress = Math.max(0, Math.min(100, calculatedProgress)); // Clamp between 0 and 100
      setProgressPercentage(calculatedProgress);

      if (diff <= 0) {
        setCountdown("Processing...");
        setProgressPercentage(100); // Show full progress when processing
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

  const payoutSchedule = useMemo(() => {
    if (!currentPayout?.nextPayoutDate || currentPayout?.isCapReached) return [];
    const potential = currentPayout.potentialRoiPerCycle ?? 0;
    const remainingCap = currentPayout.remainingEarningsCap ?? 0;
    if (!potential || !remainingCap) return [];
    const maxRows =
      currentPayout.maxRemainingRoiPayouts ??
      Math.max(1, Math.ceil(remainingCap / potential));
    const start = new Date(currentPayout.nextPayoutDate).getTime();
    if (Number.isNaN(start)) return [];
    const schedule: Array<{ date: string; amount: number }> = [];
    for (let i = 0; i < maxRows; i += 1) {
      const remaining = remainingCap - i * potential;
      if (remaining <= 0) break;
      const amount = Math.min(potential, remaining);
      const payoutDate = new Date(start + i * 30 * 24 * 60 * 60 * 1000);
      schedule.push({
        date: payoutDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        amount,
      });
    }
    return schedule;
  }, [currentPayout]);

  if (initialLoading) {
    return <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen flex items-center justify-center">Loading Payouts...</div>;
  }

  if (error) {
    return <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <AppShell
      balance={walletData?.availableBalance}
      userName={profileData?.fullName}
      userRank={rankData?.name}
      avatarUrl={profileData?.profilePicture}
    >
      <div className="dashboard-light-scope p-6 space-y-6">
        <header className="mb-8">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-white">Payouts</h1>
          <p className="text-gray-400 mt-2">Track your current earnings and review your payout history, including your special bonuses.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Current Estimated Payout" value={formatCurrency(currentPayout?.estimatedPayout ?? 0)} icon={DollarSign} />
            <Card className="bg-gray-900/50 border-gray-800 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Next Payout Countdown</CardTitle>
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white mb-2">{countdown}</div>
                    {currentPayout?.isCapReached ? (
                      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        ROI stopped, reinvest to continue.
                        <Link href="/wallet" className="ml-2 underline">
                          Reinvest now
                        </Link>
                      </div>
                    ) : (
                      nextPayoutFormattedDate && (
                        <p className="text-sm text-gray-400 mb-2">
                          Estimated Payout Date: {nextPayoutFormattedDate}
                        </p>
                      )
                    )}
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progressPercentage.toFixed(1)}% of current cycle completed</p>
                    {!currentPayout?.isCapReached && (
                      <p className="text-xs text-gray-400 mt-2">
                        You will receive your next payout once this countdown ends and the progress bar completes.
                      </p>
                    )}
                </CardContent>
            </Card>
        </div>

        {payoutSchedule.length > 0 && (
          <Card className="bg-gray-900/40 border-gray-800 mb-8">
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <CardTitle>Upcoming ROI Schedule</CardTitle>
                <p className="text-xs text-gray-500">Approximate dates (every 30 days).</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-4 w-4 text-emerald-300" />
                <span>{`~${payoutSchedule.length} payouts remaining`}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-300">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(showFullSchedule ? payoutSchedule : payoutSchedule.slice(0, 6)).map((row, index) => (
                  <div
                    key={`${row.date}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-gray-800/70 bg-black/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 p-2">
                        <Calendar className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Payout</p>
                        <p className="text-sm text-gray-200">{row.date}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(row.amount)}</span>
                  </div>
                ))}
              </div>
              {payoutSchedule.length > 6 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-800 text-gray-200 hover:bg-white/5"
                  onClick={() => setShowFullSchedule((prev) => !prev)}
                >
                  {showFullSchedule ? "Show less" : "Show more"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>Current Earnings Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        {currentPayout ? (
                            <>
                                <PayoutDetailRow label="Special Bonus Payout" value={currentPayout.earningsBreakdown.roiPayout} icon={TrendingUp} /> {/* Frontend display change: 'Special Bonus Payout' is displayed, corresponding to the backend's 'roiPayout' field. */}
                            </>
                        ) : <p className="text-gray-500">No current earnings data.</p>}
                    </CardContent>
                </Card>
                {currentPayout && (
                  <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>ROI Projection</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Estimated payout</span>
                        <span className="font-semibold text-white">{formatCurrency(currentPayout.estimatedPayout ?? 0)}</span>
                      </div>
                      {currentPayout.roiRate !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">ROI rate</span>
                          <span className="font-semibold text-white">{(currentPayout.roiRate * 100).toFixed(2)}%</span>
                        </div>
                      )}
                      {currentPayout.potentialRoiPerCycle !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Potential per cycle</span>
                          <span className="font-semibold text-white">{formatCurrency(currentPayout.potentialRoiPerCycle)}</span>
                        </div>
                      )}
                      {currentPayout.maxRemainingRoiPayouts !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">~Payouts left</span>
                          <span className="font-semibold text-white">{currentPayout.maxRemainingRoiPayouts}</span>
                        </div>
                      )}
                      {currentPayout.estimatedCapDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Approx cap date</span>
                          <span className="font-semibold text-white">
                            {new Date(currentPayout.estimatedCapDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {currentPayout.remainingEarningsCap !== undefined && (
                        <div className="flex items-center justify-between border-t border-gray-800 pt-2">
                          <span className="text-gray-400">Remaining cap</span>
                          <span className="font-semibold text-emerald-300">{formatCurrency(currentPayout.remainingEarningsCap)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>
            <div className="lg:col-span-2">
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>Payout History</CardTitle></CardHeader>
                    <CardContent>
                        {payoutHistory.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No payout history found.</p>
                        ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {payoutHistory.map((payout, index) => (
                            <AccordionItem key={payout.month} value={payout.month} className="border-b-gray-800" ref={index === payoutHistory.length - 1 ? lastPayoutElementRef : null}>
                                <AccordionTrigger className="hover:no-underline">
                                <div className="flex justify-between items-center w-full pr-4">
                                    <span className="font-semibold text-lg text-white">{payout.month}</span>
                                    <span className="text-lg font-bold text-emerald-400">{formatCurrency(payout.totalMonthlyIncome)}</span>
                                </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-black/20 p-4 rounded-b-md">
                                    <PayoutDetailRow label="Special Bonus Payout" value={payout.roiPayout} icon={TrendingUp} /> {/* Frontend display change: 'Special Bonus Payout' is displayed, corresponding to the backend's 'roiPayout' field. */}
                                </AccordionContent>
                            </AccordionItem>
                            ))}
                        </Accordion>
                        )}
                        {historyLoading && (
                            <div className="flex justify-center items-center py-4">
                                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                                <span className="ml-2 text-gray-500">Loading more...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </AppShell>
  );
};

export default PayoutsPage;
