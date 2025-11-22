"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { getRankProgress } from "@/actions/user";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Star, Trophy } from "lucide-react";
import CountdownTimer from '@/app/components/salary/CountdownTimer';

interface RankProgress {
  currentRankInDb: {
    name: string;
    badge: string;
    salary: number;
    achievedAt: string | null;
    consecutiveMonthsMissed: number;
  };
  calculatedRank: {
    name: string;
    badge: string;
    salary: number;
  };
  salaryEligibility: {
    isEligible: boolean;
    requirements: {
      monthlyBusiness: {
        current: number;
        required: number;
      };
      legRule: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
    };
  };
  progress: {
    nextRankName: string | null;
    requirements: {
      directs: {
        current: number;
        required: number;
      };
      activeTeam: {
        current: number;
        required: number;
      };
    } | null;
  };
}

const SalaryPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchRankProgress = async () => {
      try {
        const res = await getRankProgress();
        if (res.error) {
          setError(res.error);
        } else {
          setRankProgress(res);
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching rank progress.");
        console.error(err);
      }
    };

    if (token) {
      fetchRankProgress();
    }
  }, [token, isAuthenticated, loading, router]);

  if (loading || !rankProgress) {
    return (
      <div className="bg-black text-white min-h-screen">
        <Navbar userLevel={rankProgress?.currentRankInDb.name} />
        <main className="container mx-auto p-4 pt-24">
          <h1 className="text-3xl font-bold mb-8">Salary & Rank</h1>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        Error: {error}
      </div>
    );
  }

    const { currentRankInDb, calculatedRank, salaryEligibility, progress } = rankProgress;
    const hasPendingPromotion = currentRankInDb.name !== calculatedRank.name;
    
    const showTimer = currentRankInDb.salary > 0 && currentRankInDb.achievedAt;
    let payoutDate: string | null = null;
    if (showTimer) {
      const achievedDate = new Date(currentRankInDb.achievedAt!);
      payoutDate = new Date(achievedDate.setDate(achievedDate.getDate() + 30)).toISOString();
    }
  
    const renderProgress = (current: number, required: number, label: string, isCurrency = false) => {
      const percentage = required > 0 ? (current / required) * 100 : 100;
      const formatValue = (value: number) =>
        isCurrency
          ? value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
          : value;
  
      return (
        <div>
          <div className="flex justify-between mb-1 text-sm text-neutral-300">
            <span>{label}</span>
            <span className="font-semibold">{formatValue(current)} / {formatValue(required)}</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage > 100 ? 100 : percentage}%` }}></div>
          </div>
        </div>
      );
    };
  
    return (
      <div className="bg-black text-white min-h-screen">
        <Navbar userLevel={currentRankInDb.name} />
        <main className="container mx-auto p-4 pt-24">
          <h1 className="text-3xl font-bold mb-8">Salary & Rank</h1>
          
          {/* Rank Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {hasPendingPromotion ? (
              <>
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardHeader><CardTitle className="text-lg text-neutral-400 flex items-center gap-2"><Trophy className="text-yellow-400" />Your Official Rank</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">{currentRankInDb.name}</p>
                    <p className="text-lg text-green-400 font-semibold mt-1">Salary: {currentRankInDb.salary.toLocaleString("en-US", { style: "currency", currency: "USD" })} / month</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-900/50 border-green-700">
                  <CardHeader><CardTitle className="text-lg text-neutral-400 flex items-center gap-2"><CheckCircle className="text-green-400" />Your Qualified Rank</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold">{calculatedRank.name}</p>
                    <p className="text-lg font-semibold mt-1 text-green-300">Salary: {calculatedRank.salary.toLocaleString("en-US", { style: "currency", currency: "USD" })} / month</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-neutral-900 border-neutral-800 md:col-span-2">
                <CardHeader><CardTitle className="text-lg text-neutral-400 flex items-center gap-2"><Trophy className="text-yellow-400" />Your Current Rank</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{currentRankInDb.name}</p>
                  <p className="text-lg text-green-400 font-semibold mt-1">Salary: {currentRankInDb.salary.toLocaleString("en-US", { style: "currency", currency: "USD" })} / month</p>
                </CardContent>
              </Card>
            )}
          </div>
  
          {hasPendingPromotion && (
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg mb-6 text-center">
              <h2 className="text-2xl font-bold">Congratulations!</h2>
              <p>You&apos;ve met all requirements for {calculatedRank.name}. Your official rank will be updated shortly.</p>
            </div>
          )}
  
                                  {/* Salary Countdown */}
  
                                  {showTimer && payoutDate && (
  
                                    <Card className="bg-neutral-900 border-blue-800/50 mb-6">
  
                                      <CardContent className="p-6">
  
                                        <CountdownTimer expiryTimestamp={payoutDate} payoutAmount={currentRankInDb.salary} />
  
                                      </CardContent>
  
                                    </Card>
  
                                  )}
  
                          
  
                                  {/* Salary Eligibility */}
  
                                  {currentRankInDb.salary > 0 && (
  
                                    <Card className="bg-neutral-900 border-neutral-800 mb-6">
  
                                      <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-yellow-400" />Salary Eligibility for <span className="text-yellow-400 font-bold">{currentRankInDb.name}</span></CardTitle></CardHeader>
  
                                      <CardContent className="space-y-5">
  
                                        {salaryEligibility.isEligible ? (
  
                                          <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg text-center">
  
                                            <p className="text-lg text-green-300">Congratulations! You&apos;ve met the performance goals for your rank. Your 30-day salary countdown will begin shortly.</p>
  
                                          </div>
  
                                        ) : (
  
                                          salaryEligibility.requirements ? (
  
                                            <>
  
                                              {renderProgress(salaryEligibility.requirements.monthlyBusiness.current, salaryEligibility.requirements.monthlyBusiness.required, "Monthly Business Volume", true)}
  
                                              {renderProgress(salaryEligibility.requirements.legRule.current, salaryEligibility.requirements.legRule.required, `Legs with ${salaryEligibility.requirements.legRule.businessPerLeg.toLocaleString("en-US", { style: "currency", currency: "USD" })} Volume`)}
  
                                            </>
  
                                          ) : (
  
                                            <p>No salary eligibility requirements specified.</p>
  
                                          )
  
                                        )}
  
                                      </CardContent>
  
                                    </Card>
  
                                  )}
  
                          
  
                                  {currentRankInDb.salary === 0 && (
  
                                    <Card className="bg-neutral-900 border-neutral-800 mb-6">
  
                                      <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-yellow-400" />Salary Eligibility</CardTitle></CardHeader>
  
                                      <CardContent>
  
                                        <p className="text-neutral-400">No salary requirements for this rank.</p>
  
                                      </CardContent>
  
                                    </Card>
  
                                  )}
  
          
  
                  {/* Progress to Next Rank Card */}
  
                  {progress && progress.nextRankName ? (
  
                    <Card className="bg-neutral-900 border-neutral-800">
  
                      <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-purple-400" /><span>Progress to <span className="text-purple-400 font-bold">{progress.nextRankName}</span></span></CardTitle></CardHeader>
  
                      <CardContent className="space-y-5">
  
                        {progress.requirements ? (
  
                          <>
  
                            {renderProgress(progress.requirements.directs.current, progress.requirements.directs.required, "Direct Referrals")}
  
                            {renderProgress(progress.requirements.activeTeam.current, progress.requirements.activeTeam.required, "Active Team Members")}
  
                          </>
  
                        ) : (
  
                          <p>No requirements specified for the next rank.</p>
  
                        )}
  
                      </CardContent>
  
                    </Card>
  
                  ) : (
  
                    <Card className="bg-neutral-900 border-neutral-800">
  
                      <CardContent className="p-6 text-center"><p className="text-xl">You have reached the highest rank!</p></CardContent>
  
                    </Card>
  
                  )}
        </main>
      </div>
    );};

export default SalaryPage;
