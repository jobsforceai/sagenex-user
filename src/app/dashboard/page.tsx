"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Wallet, Box, User } from "lucide-react";

// Interfaces remain the same
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    if (dashboardData?.profile.referralCode) {
      navigator.clipboard.writeText(dashboardData.profile.referralCode);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy"), 2000);
    }
  };

  useEffect(() => {
    // Auth and data fetching logic remains the same
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    const fetchDashboardData = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const res = await fetch(`${backendUrl}/api/v1/user/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        } else {
          setError((await res.json()).message || "Failed to fetch dashboard data");
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
      <main className="container mx-auto p-4 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {profile.fullName}!</h1>
          <p className="text-muted-foreground">Here&apos;s a summary of your account.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Wallet</CardTitle>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                  <p className="text-4xl font-bold">${wallet.availableToWithdraw.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lifetime Earnings</p>
                  <p className="text-2xl font-semibold">${wallet.lifetimeEarnings.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Active Package</CardTitle>
                <Box className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">${userPackage.packageUSD}</p>
                <p className="text-sm text-muted-foreground">{userPackage.pvPoints} PV Points</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile</CardTitle>
                <User className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
                  <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile.fullName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
                <CardDescription>Share this code to grow your team.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-800">
                  <p className="font-mono text-lg flex-grow">{profile.referralCode}</p>
                  <Button size="sm" onClick={handleCopy} variant="ghost">
                    <Copy className="h-4 w-4 mr-2" />
                    {copyText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;