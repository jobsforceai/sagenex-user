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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  const { profile, package: userPackage, wallet } = dashboardData;

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
                <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{profile.fullName}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
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
            </CardContent>
          </Card>

          {/* Package and Wallet Info */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Package</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${userPackage.packageUSD}</p>
                <p className="text-sm text-muted-foreground">{userPackage.pvPoints} PV Points</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${wallet.availableToWithdraw.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                <p className="mt-4 text-lg">${wallet.lifetimeEarnings.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Lifetime Earnings</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;