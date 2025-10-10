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
import { getPayouts } from "@/actions/user";

interface Payout {
  month: string;
  packageUSD: number;
  roiPayout: number;
  directReferralBonus: number;
  unilevelBonus: number;
  salary: number;
  totalMonthlyIncome: number;
}

const PayoutsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchPayouts = async () => {
      try {
        const data = await getPayouts();
        if (data.error) {
          setError(data.error);
        } else {
          setPayouts(data);
        }
      } catch {
        setError("An error occurred while fetching payouts");
      } finally {
        setDataLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPayouts();
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
      <div className="container mx-auto p-4 pt-24">
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p>No payouts found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.month}>
                      <TableCell>{payout.month}</TableCell>
                      <TableCell>${payout.totalMonthlyIncome.toFixed(2)}</TableCell>
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

export default PayoutsPage;
