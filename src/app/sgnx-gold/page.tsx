"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SgnxGoldHero from "@/app/components/sgnx-gold/SgnxGoldHero";
import LivePriceCards from "@/app/components/sgnx-gold/LivePriceCards";
import CityPricesGrid from "@/app/components/sgnx-gold/CityPricesGrid";
import PriceChart from "@/app/components/sgnx-gold/PriceChart";
import PaymentProgress from "@/app/components/sgnx-gold/PaymentProgress";
import TransactionHistory from "@/app/components/sgnx-gold/TransactionHistory";
import EnrollModal from "@/app/components/sgnx-gold/EnrollModal";
import {
  getMyEnrollments,
  getLiveGoldRate,
  getLivePrices,
  getCityPrices,
} from "@/actions/sgnxgold";
import { getDashboardData } from "@/actions/user";
import { Loader2 } from "lucide-react";

// Lazy-load the tree (heavy: React Flow + dagre)
const SgnxGoldTree = dynamic(
  () => import("@/app/components/sgnx-gold/SgnxGoldTree"),
  { ssr: false, loading: () => <TreeSkeleton /> },
);

function TreeSkeleton() {
  return (
    <div className="rounded-[20px] border border-[#3c4256] bg-[#1B1F2D] overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[#3c4256] px-5 py-4">
        <div className="h-4 w-4 rounded bg-[#252A3A] animate-pulse" />
        <div className="h-4 w-32 rounded bg-[#252A3A] animate-pulse" />
      </div>
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#D7AF35]" />
      </div>
    </div>
  );
}

// Skeleton components for each section
function HeroSkeleton() {
  return (
    <div className="rounded-[30px] border border-[#7f70ba]/35 bg-[#1B1F2D] p-6 animate-pulse">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="h-4 w-40 rounded bg-[#252A3A]" />
          <div className="h-10 w-56 rounded bg-[#252A3A]" />
          <div className="h-4 w-80 rounded bg-[#252A3A]" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-[#3c4256] bg-[#252A3A]/60 p-4 h-20" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#252A3A]/60 h-48" />
      </div>
    </div>
  );
}

function PriceCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl border border-[#3c4256] bg-[#1B1F2D] p-5 h-28 animate-pulse">
          <div className="h-3 w-16 rounded bg-[#252A3A] mb-3" />
          <div className="h-6 w-32 rounded bg-[#252A3A] mb-2" />
          <div className="h-3 w-20 rounded bg-[#252A3A]" />
        </div>
      ))}
    </div>
  );
}

interface Enrollment {
  _id: string;
  planType: "gold" | "cash";
  monthlyAmountUsd: number;
  status: string;
  completedMonths: number;
  totalMonths: number;
  bonusGoldQuantityGrams?: number;
  goldRateLockedPerGram?: number;
  nextDueDate?: string;
  createdAt: string;
}

interface Vault {
  totalGoldQuantityGrams?: number;
  totalGoldValueLockedUsd?: number;
  totalCashBonusUsd?: number;
  totalDepositedUsd?: number;
  maturityValueUsd?: number;
}

interface LivePriceData {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface CityPrice {
  city: string;
  pricePerGram: number;
}

export default function SgnxGoldPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Each section has its own loading state
  const [heroLoading, setHeroLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(true);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [goldRate, setGoldRate] = useState<{ pricePerGramUsd: number } | null>(null);
  const [goldLive, setGoldLive] = useState<LivePriceData | null>(null);
  const [silverLive, setSilverLive] = useState<LivePriceData | null>(null);
  const [cityPrices, setCityPrices] = useState<CityPrice[]>([]);
  const [activeMetal, setActiveMetal] = useState<"gold" | "silver">("gold");
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [profileData, setProfileData] = useState<{ fullName?: string; profilePicture?: string; } | null>(null);
  const [rankData, setRankData] = useState<{ name?: string } | null>(null);
  const [walletData, setWalletData] = useState<{ availableBalance?: number } | null>(null);

  // Fetch hero data (enrollments + gold rate)
  const fetchHeroData = useCallback(async () => {
    setHeroLoading(true);
    try {
      const [enrollResult, rateResult] = await Promise.allSettled([
        getMyEnrollments(),
        getLiveGoldRate(),
      ]);
      if (enrollResult.status === "fulfilled" && !enrollResult.value?.error) {
        setEnrollments(enrollResult.value.enrollments ?? []);
        setVault(enrollResult.value.vault ?? null);
      }
      if (rateResult.status === "fulfilled" && !rateResult.value?.error) {
        setGoldRate(rateResult.value);
      }
    } finally {
      setHeroLoading(false);
    }
  }, []);

  // Fetch live prices (independent)
  const fetchPrices = useCallback(async () => {
    setPricesLoading(true);
    try {
      const [goldRes, silverRes] = await Promise.allSettled([
        getLivePrices("gold", "INR"),
        getLivePrices("silver", "INR"),
      ]);
      if (goldRes.status === "fulfilled" && !goldRes.value?.error) setGoldLive(goldRes.value);
      if (silverRes.status === "fulfilled" && !silverRes.value?.error) setSilverLive(silverRes.value);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // Fetch city prices (independent)
  const fetchCityPrices = useCallback(async () => {
    setCityLoading(true);
    try {
      const res = await getCityPrices();
      if (!res?.error) setCityPrices(res.prices ?? []);
    } finally {
      setCityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      // Fire all fetches independently
      fetchHeroData();
      fetchPrices();
      fetchCityPrices();
      
      // Fetch dashboard data for AppShell
      getDashboardData().then((dashboardData) => {
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
      });
    }
  }, [isAuthenticated, authLoading, router, fetchHeroData, fetchPrices, fetchCityPrices]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#C41E3A]" />
      </div>
    );
  }

  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE") ?? null;
  const hasEnrollment = enrollments.length > 0;

  const handleEnrollSuccess = () => {
    setEnrollModalOpen(false);
    fetchHeroData();
  };

  return (
    <>
      <div className="dashboard-light-scope min-h-screen bg-[#f8f9fa] p-6 space-y-6">

        {/* Hero Portfolio - own loading */}
        {heroLoading ? <HeroSkeleton /> : (
          <SgnxGoldHero
            totalDepositedUsd={vault?.totalDepositedUsd ?? 0}
            totalGoldGrams={vault?.totalGoldQuantityGrams ?? 0}
            maturityValueUsd={vault?.maturityValueUsd ?? 0}
            totalCashBonusUsd={vault?.totalCashBonusUsd ?? 0}
            goldRateUsd={goldRate?.pricePerGramUsd ?? null}
            hasEnrollment={hasEnrollment}
          />
        )}

        {/* Action Buttons */}
        {!heroLoading && (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setEnrollModalOpen(true)}
              className="rounded-xl bg-[#D7AF35] px-5 py-2.5 text-sm font-extrabold text-[#171B27] shadow-sm transition hover:brightness-110"
            >
              {hasEnrollment ? "New Investment" : "Start Investing"}
            </button>
            {hasEnrollment && (
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="rounded-xl border border-[#111827] bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f2937]"
              >
                {showHistory ? "Hide History" : "View History"}
              </button>
            )}
          </div>
        )}

        {/* Live Price Cards - own loading */}
        {pricesLoading ? <PriceCardsSkeleton /> : (
          <LivePriceCards
            gold={goldLive}
            silver={silverLive}
            activeMetal={activeMetal}
            onMetalChange={setActiveMetal}
          />
        )}

        {/* Price Chart (fetches its own data internally) */}
        <PriceChart metal={activeMetal} />

        {/* City Prices - own loading */}
        {cityLoading ? null : <CityPricesGrid prices={cityPrices} />}

        {/* Payment Progress (if active enrollment) */}
        {!heroLoading && activeEnrollment && (
          <PaymentProgress enrollmentId={activeEnrollment._id} />
        )}

        {/* Transaction History (toggle) */}
        {showHistory && hasEnrollment && (
          <TransactionHistory enrollments={enrollments} />
        )}

        {/* SGNX Gold Referral Tree - lazy loaded on scroll */}
        <SgnxGoldTree />
      </div>

      {/* Enrollment Modal */}
      <EnrollModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        onSuccess={handleEnrollSuccess}
      />
    </>
  );
}
