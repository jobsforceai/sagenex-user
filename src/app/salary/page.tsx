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
  rank: {
    name: string;
    badge: string;
    salary: number;
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
      monthlyBusiness: {
        current: number;
        required: number;
      };
      legRule: {
        current: number;
        required: number;
        businessPerLeg: number;
      };
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
        <Navbar userLevel={rankProgress?.rank.name} />
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

    const { rank, performanceRank, salaryEligibility, progress } = rankProgress;

    let displayMessage = "";
    let displayGracePeriodStatus = "";

    if (salaryEligibility.isEligible) {
        displayMessage = `Congratulations! You have met the performance requirements for '${performanceRank.name}' and are eligible for this month's salary of ${performanceRank.salary.toLocaleString("en-US", { style: "currency", currency: "USD" })}.`;
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
          ? value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 })
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
  
    return (
      <div className="bg-black text-white min-h-screen">
        <Navbar userLevel={rank.name} />
        <main className="container mx-auto p-4 pt-24">
          <h1 className="text-3xl font-bold mb-8">Salary & Rank</h1>
          


          {/* Section B: This Month's Performance */}
          <Card className="bg-neutral-900 border-neutral-800 mb-6">
            <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-yellow-400" />This Month's Performance</CardTitle></CardHeader>
            <CardContent>
                {salaryEligibility.isEligible ? (
                    <div className="text-center p-4 bg-green-900/50 border border-green-700 rounded-lg">
                        <p className="text-lg text-green-300">Congratulations! You are eligible for this month's salary.</p>
                        <p className="text-4xl font-bold text-white mt-2">{performanceRank.name}</p>
                        <p className="text-2xl font-semibold text-green-400 mt-1">
                            {performanceRank.salary.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                        </p>
                    </div>
                ) : (
                    <p className="text-yellow-400">{displayMessage}</p>
                )}
            </CardContent>
          </Card>
          


          {/* Section D: Progress Towards Next Rank */}
          {progress && progress.nextRankName ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader><CardTitle className="text-2xl flex items-center gap-3"><Star className="text-purple-400" /><span>Progress Towards <span className="text-purple-400 font-bold">{progress.nextRankName}</span></span></CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {progress.requirements ? (
                  <>
                    {renderProgress(progress.requirements.directs.current, progress.requirements.directs.required, "Directs")}
                    {renderProgress(progress.requirements.activeTeam.current, progress.requirements.activeTeam.required, "Active Team Members")}
                    {progress.requirements.monthlyBusiness && renderProgress(progress.requirements.monthlyBusiness.current, progress.requirements.monthlyBusiness.required, "Monthly Business Volume", true)}
                    {progress.requirements.legRule && renderProgress(progress.requirements.legRule.current, progress.requirements.legRule.required, `Legs with ${progress.requirements.legRule.businessPerLeg.toLocaleString("en-US", { style: "currency", currency: "USD" })} Volume`)}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">{leg.monthlyBusiness.toLocaleString("en-US", { style: "currency", currency: "USD" })}</td>
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
