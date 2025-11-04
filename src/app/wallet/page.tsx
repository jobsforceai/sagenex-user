"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import CryptoDeposit from "@/app/components/wallet/CryptoDeposit";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWalletTransactions, getDashboardData, getKycStatus, getAllCourses } from "@/actions/user";
import { KycStatus, CourseSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Interfaces from the original file
interface WalletTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  createdBy: string;
  createdAt: string;
  meta: Record<string, unknown>;
}

interface DashboardData {
  package: {
    packageUSD: number;
  };
  wallet: {
    availableBalance: number;
  };
}

const getTierColor = (price: number) => {
  if (price <= 50) return "from-green-500 to-emerald-600";
  if (price <= 100) return "from-orange-500 to-amber-600";
  if (price <= 300) return "from-gray-500 to-slate-600";
  if (price <= 500) return "from-yellow-500 to-amber-600";
  if (price <= 1000) return "from-purple-500 to-indigo-600";
  if (price <= 2500) return "from-teal-500 to-cyan-600";
  if (price <= 5000) return "from-blue-500 to-sky-600";
  if (price <= 10000) return "from-red-500 to-rose-600";
  return "from-gray-700 to-gray-800";
};

const UpgradeCard = ({ currentPackage, nextPackage }: { currentPackage: number, nextPackage: CourseSummary | null }) => {
    return (
        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
                <CardTitle>Your Plan</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className={`p-4 rounded-lg text-white bg-gradient-to-br ${getTierColor(currentPackage)}`}>
                    <p className="text-sm">Current Package</p>
                    <p className="text-2xl font-bold">${currentPackage.toFixed(2)}</p>
                </div>

                <ArrowRight className="text-gray-400 hidden md:block" />

                {nextPackage ? (
                    <div className={`p-4 rounded-lg text-white bg-gradient-to-br ${getTierColor(nextPackage.price)}`}>
                        <p className="text-sm">Next Upgrade</p>
                        <p className="text-2xl font-bold">${nextPackage.price.toFixed(2)}</p>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg text-white bg-gray-700">
                        <p className="text-sm">No further upgrades</p>
                        <p className="text-2xl font-bold">Max Level</p>
                    </div>
                )}
                
                {nextPackage && (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        Upgrade Now
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};


const WalletPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [walletData, dashboardRes, kycData, coursesData] = await Promise.all([
            getWalletTransactions(),
            getDashboardData(),
            getKycStatus(),
            getAllCourses(),
        ]);

        if (walletData.error || dashboardRes.error || kycData.error || coursesData.error) {
          throw new Error(walletData.error || dashboardRes.error || kycData.error || coursesData.error || "Failed to fetch data");
        }

        setTransactions(walletData);
        setDashboardData(dashboardRes);
        setKycStatus(kycData);
        setCourses(coursesData.data || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router]);

  const nextPackage = courses
    .filter(c => c.price > (dashboardData?.package.packageUSD ?? 0))
    .sort((a, b) => a.price - b.price)[0] || null;

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24 space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">Manage your funds, view transactions, and upgrade your plan.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-gray-900/40 border-gray-800">
                    <CardHeader><CardTitle>Available Balance</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-emerald-400">
                            ${dashboardData?.wallet.availableBalance.toFixed(2)}
                        </p>
                    </CardContent>
                </Card>
                <UpgradeCard 
                    currentPackage={dashboardData?.package.packageUSD ?? 0}
                    nextPackage={nextPackage}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FundTransfer currentBalance={dashboardData?.wallet.availableBalance ?? 0} />
                <WithdrawalRequest 
                    currentBalance={dashboardData?.wallet.availableBalance ?? 0}
                    kycStatus={kycStatus?.status}
                />
            </div>
          </div>
          <div className="lg:col-span-1">
            <CryptoDeposit />
          </div>
        </div>

        <Card className="bg-gray-900/40 border-gray-800">
          <CardHeader>
            <CardTitle>Wallet History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="text-white">Amount</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx._id} className="border-gray-800">
                        <TableCell className="font-medium">{tx.type}</TableCell>
                        <TableCell className={tx.amount > 0 ? "text-green-400" : "text-red-400"}>
                            ${tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{tx.status}</TableCell>
                        <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;