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
import { Button } from "@/components/ui/button";
import { Copy, BadgeCheck, XCircle, ShieldCheck, ShieldAlert, ShieldClose } from "lucide-react";
import { getProfileData, getKycStatus } from "@/actions/user";
import { KycStatus } from "@/types";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  profilePicture: string;
  referralCode: string;
  originalSponsorId: string | null;
  parentId: string | null;
  isSplitSponsor: boolean;
  packageUSD: number;
  pvPoints: number;
  dateJoined: string;
  status: 'active' | 'inactive';
  isPackageActive: boolean;
}

const KycStatusBadge = ({ status }: { status: KycStatus['status'] }) => {
    const kycStatusInfo = {
        VERIFIED: {
            icon: <ShieldCheck className="h-4 w-4" />,
            text: "KYC Verified",
            className: "bg-green-500/20 text-green-400",
        },
        PENDING: {
            icon: <ShieldAlert className="h-4 w-4" />,
            text: "KYC Pending",
            className: "bg-yellow-500/20 text-yellow-400",
        },
        REJECTED: {
            icon: <ShieldClose className="h-4 w-4" />,
            text: "KYC Rejected",
            className: "bg-red-500/20 text-red-400",
        },
        NOT_SUBMITTED: {
            icon: <ShieldClose className="h-4 w-4" />,
            text: "KYC Not Verified",
            className: "bg-gray-500/20 text-gray-400",
        }
    };

    const { icon, text, className } = kycStatusInfo[status];

    return (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${className}`}>
            {icon} {text}
        </span>
    );
};

const ProfilePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy"), 2000);
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchPageData = async () => {
        try {
            const [profileData, kycData] = await Promise.all([
                getProfileData(),
                getKycStatus()
            ]);

            if (profileData.error) {
                setError(profileData.error);
            } else {
                setProfile(profileData);
            }

            if (kycData.error) {
                console.error("Could not fetch KYC status:", kycData.error);
            } else {
                setKycStatus(kycData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        }
    };

    if (isAuthenticated) {
      fetchPageData();
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !profile) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-2 border-primary">
            <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
            <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{profile.fullName}</h1>
            <p className="text-muted-foreground">{profile.email}</p>
            <div className="flex items-center justify-center md:justify-start flex-wrap gap-2 mt-2">
              <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full ${profile.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {profile.status}
              </span>
              {profile.isPackageActive ? (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">
                  <BadgeCheck className="h-4 w-4" /> Package Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-400">
                  <XCircle className="h-4 w-4" /> Package Inactive
                </span>
              )}
              {kycStatus && <KycStatusBadge status={kycStatus.status} />}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">User ID</p>
                    <p className="text-muted-foreground">{profile.userId}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Phone Number</p>
                    <p className="text-muted-foreground">{profile.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Date Joined</p>
                    <p className="text-muted-foreground">{new Date(profile.dateJoined).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold">Package Value</p>
                    <p className="text-2xl font-bold">${profile.packageUSD.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold">PV Points</p>
                    <p className="text-2xl font-bold">{profile.pvPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Referral Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold">Your Referral Code</p>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-800 mt-1">
                  <p className="font-mono text-lg flex-grow">{profile.referralCode}</p>
                  <Button size="sm" onClick={handleCopy} variant="ghost">
                    <Copy className="h-4 w-4 mr-2" />
                    {copyText}
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-semibold">Original Sponsor ID</p>
                <p className="text-muted-foreground">{profile.originalSponsorId || 'N/A'}</p>
              </div>
              <div>
                <p className="font-semibold">Placement Parent ID</p>
                <p className="text-muted-foreground">{profile.parentId || 'N/A'}</p>
              </div>
              {profile.isSplitSponsor && <p className="text-amber-400 text-xs font-semibold">This is a split sponsorship.</p>}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;