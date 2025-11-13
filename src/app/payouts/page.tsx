"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPayouts, getCurrentPayoutProgress } from "@/actions/user";
import { DollarSign, CalendarDays, TrendingUp, Loader2 } from "lucide-react";
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
const FuturePayoutsModal = ({ nextPayoutDate, onClose }: { nextPayoutDate: string | null; onClose: () => void }) => {
    const futureDates = useMemo(() => {
        if (!nextPayoutDate) return [];
        const dates = [];
        const startDate = new Date(nextPayoutDate);
        for (let i = 0; i < 12; i++) {
            const futureDate = new Date(startDate);
            futureDate.setDate(startDate.getDate() + (30 * i));
            dates.push(futureDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
        return dates;
    }, [nextPayoutDate]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-white mb-4">Future Payout Dates</h3>
                <p className="text-gray-400 mb-6">Here are the estimated payout dates for the next 12 months.</p>
                <ul className="space-y-2 text-left">
                    {futureDates.map((date, index) => (
                        <li key={index} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-md">
                            <CalendarDays className="w-4 h-4 text-emerald-400" />
                            <span className="text-white">{date}</span>
                        </li>
                    ))}
                </ul>
                <Button variant="secondary" className="mt-6 w-full" onClick={onClose}>Close</Button>
            </div>
        </div>
    );
};

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
    amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

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
  const [isFuturePayoutsModalOpen, setIsFuturePayoutsModalOpen] = useState(false);

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
        const [currentData, historyData] = await Promise.all([
            getCurrentPayoutProgress(),
            getPayouts(1)
        ]);

        if (currentData.error) setError(currentData.error);
        else setCurrentPayout(currentData);

        if (historyData.error) setError(historyData.error);
        else {
            setPayoutHistory(historyData.payouts);
            setPagination(historyData.pagination);
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching data.");
      } finally {
        setInitialLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!currentPayout?.nextPayoutDate) {
        setCountdown("Not started");
        setNextPayoutFormattedDate("N/A");
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

  if (initialLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading Payouts...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white">Payouts</h1>
          <p className="text-gray-400 mt-2">Track your current earnings and review your payout history.</p>
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
                    {nextPayoutFormattedDate && <p className="text-sm text-gray-400 mb-2">Estimated Payout Date: {nextPayoutFormattedDate}</p>}
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progressPercentage.toFixed(1)}% of current cycle completed</p>
                    <p className="text-xs text-gray-400 mt-2">You will receive your next payout once this countdown ends and the progress bar completes.</p>
                    <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setIsFuturePayoutsModalOpen(true)}>
                        View Future Payouts
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>Current Earnings Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        {currentPayout ? (
                            <>
                                <PayoutDetailRow label="ROI Payout" value={currentPayout.earningsBreakdown.roiPayout} icon={TrendingUp} />
                            </>
                        ) : <p className="text-gray-500">No current earnings data.</p>}
                    </CardContent>
                </Card>
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
                                    <PayoutDetailRow label="ROI Payout" value={payout.roiPayout} icon={TrendingUp} />
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
      </main>
      {isFuturePayoutsModalOpen && (
        <FuturePayoutsModal 
            nextPayoutDate={currentPayout?.nextPayoutDate ?? null}
            onClose={() => setIsFuturePayoutsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PayoutsPage;
