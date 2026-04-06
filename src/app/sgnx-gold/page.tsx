"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import OverviewCards from "@/app/components/sgnx-gold/OverviewCards";
import VaultSection from "@/app/components/sgnx-gold/VaultSection";
import PaymentProgress from "@/app/components/sgnx-gold/PaymentProgress";
import EnrollForm from "@/app/components/sgnx-gold/EnrollForm";
import TransactionHistory from "@/app/components/sgnx-gold/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getMyEnrollments, getLiveGoldRate } from "@/actions/sgnxgold";
import { Loader2, Gem } from "lucide-react";

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

interface GoldRate {
  pricePerGram: number;
  pricePerGramBeforeGst: number;
  gstPercent: number;
  pricePerGramUsd: number;
  exchangeRate: number;
  source: string;
  timestamp: string;
}

export default function SgnxGoldPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [vault, setVault] = useState<Vault | null>(null);
  const [goldRate, setGoldRate] = useState<GoldRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("enroll");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [enrollResult, rateResult] = await Promise.allSettled([
        getMyEnrollments(),
        getLiveGoldRate(),
      ]);

      if (enrollResult.status === "fulfilled") {
        const data = enrollResult.value;
        if (data?.error) {
          setError(data.error);
        } else {
          setEnrollments(data.enrollments ?? []);
          setVault(data.vault ?? null);
        }
      } else {
        setError("Unable to load enrollments.");
      }

      if (rateResult.status === "fulfilled") {
        const rateData = rateResult.value;
        if (rateData && !rateData.error) {
          setGoldRate(rateData);
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router, fetchData]);

  // Set active tab based on whether user has active enrollment
  useEffect(() => {
    if (!loading && enrollments.length > 0) {
      const hasActive = enrollments.some((e) => e.status === "ACTIVE");
      if (hasActive) {
        setActiveTab("dashboard");
      }
    }
  }, [loading, enrollments]);

  if (authLoading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE") ?? null;
  const hasActiveEnrollment = activeEnrollment !== null;

  const handleEnrollSuccess = () => {
    fetchData();
    setActiveTab("dashboard");
  };

  return (
    <div className="bg-black text-white min-h-screen mt-10">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <Gem className="h-8 w-8 text-amber-400" />
              SGNX Gold
            </h1>
            <p className="text-gray-400 mt-1">
              Invest in gold or cash plans with bonus multipliers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {goldRate && (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                Gold: ${goldRate.pricePerGramUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/g
              </Badge>
            )}
            {hasActiveEnrollment && (
              <Badge variant="success">Active Enrollment</Badge>
            )}
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center">
              <TabsList
                className={`grid w-full ${
                  hasActiveEnrollment ? "grid-cols-3" : "grid-cols-2"
                } max-w-md bg-gray-900/40 border border-gray-800 rounded-2xl p-1`}
              >
                {hasActiveEnrollment && (
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                )}
                <TabsTrigger value="enroll">Enroll</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab */}
            {hasActiveEnrollment && activeEnrollment && (
              <TabsContent value="dashboard" className="space-y-6 mt-6">
                <OverviewCards
                  enrollment={activeEnrollment}
                  goldRate={goldRate}
                />
                <VaultSection
                  vault={vault}
                  planType={activeEnrollment.planType}
                  goldRate={goldRate}
                />
                <PaymentProgress enrollmentId={activeEnrollment._id} />
              </TabsContent>
            )}

            {/* Enroll Tab */}
            <TabsContent value="enroll" className="mt-6">
              <EnrollForm
                userId={user?.userId ?? ""}
                onSuccess={handleEnrollSuccess}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <TransactionHistory enrollments={enrollments} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
