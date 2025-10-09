"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  profilePicture: string;
  referralCode: string;
  dateJoined: string;
}

interface UserPackage {
  packageUSD: number;
  pvPoints: number;
}

interface UserWallet {
  availableToWithdraw: number;
  lifetimeEarnings: number;
}

interface DashboardData {
  profile: UserProfile;
  package: UserPackage;
  wallet: UserWallet;
}

const DashboardPage = () => {
  const { token, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const res = await fetch(`${backendUrl}/api/v1/user/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Failed to fetch dashboard data");
        }
      } catch {
        setError("An error occurred while fetching dashboard data");
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token, isAuthenticated, loading, router]);

  if (loading || !dashboardData) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const { profile, package: userPackage, wallet } = dashboardData;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-4">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <Image
          src={profile.profilePicture}
          alt={profile.fullName}
          width={96}
          height={96}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <p>
          <strong>Name:</strong> {profile.fullName}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Referral Code:</strong> {profile.referralCode}
        </p>
        <p>
          <strong>Date Joined:</strong>{" "}
          {new Date(profile.dateJoined).toLocaleDateString()}
        </p>
      </div>

      {/* Navigation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Link href="/wallet">
          <p className="bg-blue-500 text-white text-center font-bold py-4 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-300">
            View Wallet
          </p>
        </Link>
        <Link href="/team">
          <p className="bg-green-500 text-white text-center font-bold py-4 px-4 rounded-lg hover:bg-green-600 transition-colors duration-300">
            My Team
          </p>
        </Link>
        <Link href="/payouts">
          <p className="bg-indigo-500 text-white text-center font-bold py-4 px-4 rounded-lg hover:bg-indigo-600 transition-colors duration-300">
            Payout History
          </p>
        </Link>
      </div>

      {/* Package and Wallet Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Package Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Package</h2>
          <p>
            <strong>Package USD:</strong> ${userPackage.packageUSD}
          </p>
          <p>
            <strong>PV Points:</strong> {userPackage.pvPoints}
          </p>
        </div>

        {/* Wallet Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Wallet</h2>
          <p>
            <strong>Available to Withdraw:</strong> $
            {wallet.availableToWithdraw.toFixed(2)}
          </p>
          <p>
            <strong>Lifetime Earnings:</strong> $
            {wallet.lifetimeEarnings.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;