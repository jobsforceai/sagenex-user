"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

interface Payout {
  _id: string;
  userId: string;
  month: string;
  packageUSD: number;
  roiPayout: number;
  directReferralBonus: number;
  unilevelBonus: number;
  salary: number;
  totalMonthlyIncome: number;
  calculatedAt: string;
}

const PayoutsPage = () => {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
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
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const res = await fetch(`${backendUrl}/api/v1/user/payouts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setPayouts(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Failed to fetch payouts");
        }
      } catch {
        setError("An error occurred while fetching payouts");
      } finally {
        setDataLoading(false);
      }
    };

    if (token) {
      fetchPayouts();
    }
  }, [token, isAuthenticated, authLoading, router]);

  if (authLoading || dataLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-l"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold pl-4">Payout History</h1>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        {payouts.length === 0 ? (
          <p>No payouts found.</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">Month</th>
                <th className="text-left">Total Income</th>
                <th className="text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout._id}>
                  <td>{payout.month}</td>
                  <td>${payout.totalMonthlyIncome.toFixed(2)}</td>
                  <td>{new Date(payout.calculatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};


export default PayoutsPage;
