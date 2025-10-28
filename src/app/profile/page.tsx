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
import { Input } from "@/components/ui/input";
import { Copy, BadgeCheck, XCircle, ShieldCheck, ShieldAlert, ShieldClose, Edit } from "lucide-react";
import { getProfileData, getKycStatus, updateUserProfile } from "@/actions/user";
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
  usdtTrc20Address: string | null;
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', usdtTrc20Address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                setFormData({
                    fullName: profileData.fullName,
                    phone: profileData.phone || '',
                    usdtTrc20Address: profileData.usdtTrc20Address || '',
                });
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

  const handleCopy = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode);
      setCopyText("Copied!");
      setTimeout(() => setCopyText("Copy"), 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!formData.fullName.trim() || !formData.phone.trim()) {
        setMessage({ type: 'error', text: 'Full name and phone number cannot be empty.' });
        setIsSubmitting(false);
        return;
    }

    const dataToUpdate: { fullName?: string; phone?: string; usdtTrc20Address?: string } = {};
    if (formData.fullName !== profile?.fullName) {
        dataToUpdate.fullName = formData.fullName;
    }
    if (formData.phone !== (profile?.phone || '')) {
        dataToUpdate.phone = formData.phone;
    }
    if (formData.usdtTrc20Address !== (profile?.usdtTrc20Address || '')) {
        dataToUpdate.usdtTrc20Address = formData.usdtTrc20Address;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        setMessage({ type: 'error', text: 'No changes detected.' });
        setIsSubmitting(false);
        setIsEditing(false);
        return;
    }

    try {
        const result = await updateUserProfile(dataToUpdate);
        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setProfile(result.user);
            setIsEditing(false);
        }
    } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

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
          <div className="md:ml-auto">
            <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
            </Button>
          </div>
        </div>

        {message && (
            <div className={`p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                {message.text}
            </div>
        )}

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
                  <div>
                    <p className="font-semibold">USDT (TRC20) Address</p>
                    <p className="text-muted-foreground break-all">{profile.usdtTrc20Address || 'Not provided'}</p>
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

        {isEditing && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setIsEditing(false)}>
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-6 text-white">Edit Profile</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                            <Input
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="usdtTrc20Address" className="block text-sm font-medium text-gray-400 mb-2">USDT (TRC20) Address</label>
                            <Input
                                id="usdtTrc20Address"
                                name="usdtTrc20Address"
                                value={formData.usdtTrc20Address}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <Button type="button" onClick={() => setIsEditing(false)} variant="outline">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;