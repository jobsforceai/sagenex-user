"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import FundTransfer from "@/app/components/wallet/FundTransfer";
import CryptoDeposit from "@/app/components/wallet/CryptoDeposit";
import WithdrawalRequest from "@/app/components/wallet/WithdrawalRequest";
import TransferToSGChain from "@/app/components/wallet/TransferToSGChain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWalletData, getDashboardData, getKycStatus } from "@/actions/user";
import { KycStatus } from "@/types";
import { Lock } from "lucide-react";

// Interfaces for wallet page data
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

interface LockedBonus {
    level: number;
    name: string;
    lockedAmount: number;
    isUnlocked: boolean;
    unlockRequirement: string;
    progress: {
        current: number;
        required: number;
    };
}

interface DashboardData {
  package: {
    packageUSD: number;
  };
  wallet: {
    availableBalance: number;
    bonuses: LockedBonus[];
  };
}

const LockedBonusesCard = ({ bonuses }: { bonuses: LockedBonus[] | undefined }) => {
    return (
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Locked Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
                {bonuses && bonuses.length > 0 ? (
                    <div className="space-y-4">
                        {bonuses.filter(bonus => bonus.lockedAmount > 0).map(bonus => {
                            const progressPercentage = (bonus.progress.current / bonus.progress.required) * 100;
                            return (
                                <div key={bonus.level} className="p-4 rounded-lg bg-gray-800/60 border border-gray-700/50 shadow-md">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center space-x-3">
                                            <Lock className="text-amber-400 h-5 w-5" />
                                            <p className="text-gray-200 font-semibold">{bonus.name}</p>
                                        </div>
                                        <span className="font-bold text-xl text-amber-400">${bonus.lockedAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div 
                                                className="bg-emerald-500 h-2.5 rounded-full" 
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1.5 flex justify-between">
                                            <span>{bonus.unlockRequirement}</span>
                                            <span className="font-medium">{bonus.progress.current} / {bonus.progress.required}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No locked bonuses at the moment.</p>
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
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [walletRes, dashboardRes, kycData] = await Promise.all([
            getWalletData(),
            getDashboardData(),
            getKycStatus(),
        ]);

        if (walletRes.error || dashboardRes.error || kycData.error) {
          throw new Error(walletRes.error || dashboardRes.error || kycData.error || "Failed to fetch data");
        }

        setTransactions(walletRes.ledger || walletRes || []);
        setDashboardData(dashboardRes);
        setKycStatus(kycData);

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

  if (authLoading || dataLoading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6 pt-20 sm:pt-24 space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Wallet</h1>
          <p className="text-gray-400 mt-2">Manage your funds, view transactions, and upgrade your plan.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            <Card className="bg-gray-900/40 border-gray-800">
                <CardHeader><CardTitle>Available Balance</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-emerald-400">
                        ${dashboardData?.wallet.availableBalance.toFixed(2) ?? '0.00'}
                    </p>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <FundTransfer currentBalance={dashboardData?.wallet.availableBalance ?? 0} />
                <TransferToSGChain currentBalance={dashboardData?.wallet.availableBalance ?? 0} />
            </div>
          </div>
          <div className="xl:col-span-1 space-y-6 sm:space-y-8">
            <CryptoDeposit />
            <WithdrawalRequest 
                currentBalance={dashboardData?.wallet.availableBalance ?? 0}
                kycStatus={kycStatus?.status}
            />
            <LockedBonusesCard bonuses={dashboardData?.wallet.bonuses} />
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
