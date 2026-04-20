"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRankProgress } from "@/actions/user";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { ArrowLeft, CheckCircle, Star, Trophy } from "lucide-react";
import CountdownTimer from '@/app/components/salary/CountdownTimer';

interface RankProgress {
  rank: {
    name: string;
    badge: string;
    achievedAt: string | null;
    consecutiveMonthsMissed: number;
  };
  performanceRank: {
    name: string;
    badge: string;
    salary: number;
  };
  salaryEligibility: {
    isEligible: boolean;
    requirements?: {
      directs?: {
        current: number;
        required: number;
      };
      activeLegs?: {
        current: number;
        required: number;
      };
      activeTeam?: {
        current: number;
        required: number;
      };
      monthlyBusiness?: {
        current: number;
        required: number;
      };
      legRule?: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
    };
  };
  progress: {
    nextRankName?: string | null;
    requirements?: {
      directs?: {
        current: number;
        required: number;
      };
      activeLegs?: {
        current: number;
        required: number;
      };
      activeTeam?: {
        current: number;
        required: number;
      };
      monthlyBusiness?: {
        current: number;
        required: number;
      };
      legRule?: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
      requires4x?: boolean;
    } | null;
  };
  legDetails: {
    userId: string;
    monthlyBusiness: number;
    activeTeam: number;
  }[];
}

const SalaryPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [rankProgress, setRankProgress] = useState<RankProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diff = endOfMonth.getTime() - now.getTime();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalTime = endOfMonth.getTime() - startOfMonth.getTime();
    const elapsedTime = now.getTime() - startOfMonth.getTime();
    const progress = (elapsedTime / totalTime) * 100;
    setProgressPercentage(progress);

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
}, []);

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
          console.log("Rank Progress Data:", res);
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
        <Navbar userLevel={rankProgress?.performanceRank?.name ?? rankProgress?.rank?.name} />
        <main className="container mx-auto p-4 pt-24">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
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

    const { rank, performanceRank, salaryEligibility, progress } = rankProgress;

    let displayMessage = "";
    let displayGracePeriodStatus = "";

    const salaryMin = Math.round(performanceRank.salary * 0.5);
    const salaryMax = performanceRank.salary;
    const salaryRangeText = `${salaryMin.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 })} – ${salaryMax.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 })}`;

    if (salaryEligibility.isEligible) {
        displayMessage = `Congratulations! You have met the performance requirements for '${performanceRank.name}' and are eligible for this month's salary.`;
        if (rank.consecutiveMonthsMissed === 1) {
            displayGracePeriodStatus = `You are in your 1-month grace period. Your payout will be 50% of the base salary.`;
        } else {
            displayGracePeriodStatus = `You are meeting your rank's performance goals.`;
        }
    } else {
        displayMessage = `You have not yet met the performance requirements for this month's salary. Your performance this month is at the '${performanceRank.name}' level.`;
        if (rank.consecutiveMonthsMissed === 1) {
            displayGracePeriodStatus = `Warning: You did not meet performance goals last month. If you miss this month, your salary will be paused.`;
        } else if (rank.consecutiveMonthsMissed >= 2) {
            displayGracePeriodStatus = `Salary Paused: You have missed performance goals for 2 or more consecutive months.`;
        } else {
            displayGracePeriodStatus = `You are meeting your rank's performance goals.`;
        }
    }

    const renderProgress = (current: number, required: number, label: string, isCurrency = false) => {
      const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 100;
      const formatValue = (value: number) =>
        isCurrency
          ? value.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
          : value;
  
      return (
        <div>
          <div className="flex justify-between mb-1 text-sm text-neutral-300">
            <span>{label}</span>
            <span className="font-semibold">{formatValue(current)} / {formatValue(required)}</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      );
    };

    const renderRequirement = (
      requirement: { current: number; required: number },
      label: string,
      isCurrency = false
    ) => renderProgress(requirement.current, requirement.required, label, isCurrency);

  
    return (
      <div className="bg-black text-white min-h-screen">
        <Navbar userLevel={performanceRank?.name ?? rank.name} />
        <main className="container mx-auto p-4 pt-24">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-8">Salary & Rank</h1>

          {/* Section B: This Month's Performance */}
          <Card className="bg-neutral-900 border-neutral-800 mb-6">
            <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-yellow-400" />This Month's Performance</CardTitle></CardHeader>
            <CardContent>
                {salaryEligibility.isEligible ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-left">
                                <p className="text-lg text-green-300">Eligible Salary</p>
                                <p className="text-4xl font-bold text-white mt-1">{performanceRank.name}</p>
                                <p className="text-sm text-neutral-400 mt-1">Estimated range</p>
                                <p className="text-2xl font-semibold text-green-400">
                                    {salaryRangeText}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">Actual amount credited after admin review</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-400">Salary Credits In</p>
                                <div className="text-2xl font-bold text-white">{countdown}</div>
                            </div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div
                                className="bg-emerald-500 h-2.5 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 text-center">{progressPercentage.toFixed(1)}% of cycle completed</p>
                    </div>
                ) : (
                    <p className="text-yellow-400">{displayMessage}</p>
                )}
            </CardContent>
          </Card>
          

          {/* Section D: Progress Towards Next Rank */}
          {progress?.nextRankName ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-purple-400" /><span>Progress Towards <span className="text-purple-400 font-bold">{progress.nextRankName}</span></span></CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {progress?.requirements ? (
                  <>
                    {progress.requirements.directs &&
                      renderRequirement(progress.requirements.directs, "Directs")}
                    {progress.requirements.activeLegs &&
                      renderRequirement(progress.requirements.activeLegs, "Active Legs")}
                    {progress.requirements.activeTeam &&
                      renderRequirement(progress.requirements.activeTeam, "Active Team Members")}
                    {progress.requirements.monthlyBusiness &&
                      renderRequirement(progress.requirements.monthlyBusiness, "Monthly Business Volume", true)}
                    {progress.requirements.legRule &&
                      renderRequirement(
                        progress.requirements.legRule,
                        `Legs with ${progress.requirements.legRule.businessPerLeg.toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })} Volume`
                      )}
                    {progress.requirements.requires4x && (
                      <p className="text-sm text-amber-300">
                        Requires 4x earnings multiplier (KYC verified).
                      </p>
                    )}
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

          {/* Leg Details Card */}
          {rankProgress.legDetails && (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader><CardTitle className="text-2xl">Leg Details</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-700">
                    <thead className="bg-neutral-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">User ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Monthly Business</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">Active Team</th>
                      </tr>
                    </thead>
                    <tbody className="bg-neutral-900 divide-y divide-neutral-700">
                      {rankProgress.legDetails.map((leg) => (
                        <tr key={leg.userId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{leg.userId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{leg.monthlyBusiness.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{leg.activeTeam}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    );};

export default SalaryPage;
