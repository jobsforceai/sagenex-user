"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWalletTransactions, getDashboardData } from "@/actions/user";

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
    availableToWithdraw: number;
    lifetimeEarnings: number;
  };
}

const WalletPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [walletData, dashboardData] = await Promise.all([
            getWalletTransactions(),
            getDashboardData(),
        ]);

        if (walletData.error || dashboardData.error) {
          throw new Error(walletData.error || dashboardData.error || "Failed to fetch wallet data");
        }

        setTransactions(walletData);
        setDashboardData(dashboardData);

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
      <div className="container mx-auto p-4 pt-24 space-y-6">
        <h1 className="text-3xl font-bold">My Wallet</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available to Withdraw</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${dashboardData?.wallet.availableToWithdraw.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lifetime Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${dashboardData?.wallet.lifetimeEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Package</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${dashboardData?.package.packageUSD.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p>No transactions found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>${tx.amount.toFixed(2)}</TableCell>
                      <TableCell>{tx.status}</TableCell>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
