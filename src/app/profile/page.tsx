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
import { getProfileData, getKycStatus, updateUserProfile, getNomineeStatus, setNomineePhrase, disableNomineeAccess } from "@/actions/user";
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

interface NomineeStatus {
  enabled: boolean;
  phraseHint: string | null;
  createdAt: string;
  updatedAt: string;
  lastResetAt: string | null;
  disabledAt: string | null;
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
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyText, setCopyText] = useState("Copy");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', usdtTrc20Address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [nomineeStatus, setNomineeStatus] = useState<NomineeStatus | null>(null);
  const [nomineePhrase, setNomineePhraseInput] = useState("");
  const [nomineeSubmitting, setNomineeSubmitting] = useState(false);
  const [nomineeMessage, setNomineeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchPageData = async () => {
        try {
            const [profileData, kycData, nomineeData] = await Promise.all([
                getProfileData(),
                getKycStatus(),
                getNomineeStatus()
            ]);
            console.log("Fetched Profile Data:", profileData);
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

            if (!nomineeData?.error) {
                setNomineeStatus(nomineeData);
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

  const handleNomineeUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNomineeMessage(null);

    if (nomineePhrase.trim().length < 6) {
      setNomineeMessage({ type: 'error', text: 'Nominee phrase must be at least 6 characters.' });
      return;
    }

    setNomineeSubmitting(true);
    try {
      const result = await setNomineePhrase(nomineePhrase.trim());
      if (result.error) {
        setNomineeMessage({ type: 'error', text: result.error });
      } else {
        setNomineeStatus(result.nominee);
        setNomineeMessage({ type: 'success', text: result.message || 'Nominee access updated.' });
        setNomineePhraseInput("");
      }
    } catch (err) {
      setNomineeMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
      setNomineeSubmitting(false);
    }
  };

  const handleNomineeDisable = async () => {
    setNomineeMessage(null);
    setNomineeSubmitting(true);
    try {
      const result = await disableNomineeAccess();
      if (result.error) {
        setNomineeMessage({ type: 'error', text: result.error });
      } else {
        setNomineeStatus(result.nominee);
        setNomineeMessage({ type: 'success', text: result.message || 'Nominee access disabled.' });
      }
    } catch (err) {
      setNomineeMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unknown error occurred.' });
    } finally {
      setNomineeSubmitting(false);
    }
  };

  if (loading || !profile) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  const isNominee = user?.role === "nominee";
  const formatNomineeDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 pt-24 space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-black to-black p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-5">
              <div className="rounded-full bg-emerald-500/20 p-1.5 ring-1 ring-emerald-400/40">
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
                  <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="text-sm text-emerald-200/80">Profile</p>
                <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                <p className="text-sm text-gray-400">{profile.email}</p>
                {isNominee && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                    Viewing as nominee
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              <Button onClick={() => router.push('/expenses')} size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                Expenses
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-black/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-gray-400">Package Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">${profile.packageUSD.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-gray-400">PV Points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{profile.pvPoints}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-gray-400">Date Joined</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{new Date(profile.dateJoined).toLocaleDateString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-black/50 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-gray-400">User ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{profile.userId}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {!isNominee && (
          <section>
            <Card className="bg-black/60 border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Nominee Access</CardTitle>
                <p className="text-sm text-gray-400">
                  Allow a trusted nominee to view your account data with a read-only login.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${nomineeStatus?.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-800 text-gray-300'}`}>
                    {nomineeStatus?.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span>Phrase hint: <span className="text-gray-100">{nomineeStatus?.phraseHint || "—"}</span></span>
                  <span>Last reset: <span className="text-gray-100">{formatNomineeDate(nomineeStatus?.lastResetAt)}</span></span>
                </div>

                <form onSubmit={handleNomineeUpdate} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-500">Nominee phrase</label>
                    <Input
                      type="password"
                      placeholder="Enter a phrase (min 6 characters)"
                      value={nomineePhrase}
                      onChange={(e) => setNomineePhraseInput(e.target.value)}
                      className="mt-2 bg-black border-gray-800 text-white"
                      disabled={nomineeSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600"
                    disabled={nomineeSubmitting}
                  >
                    {nomineeStatus?.enabled ? "Reset Phrase" : "Enable Access"}
                  </Button>
                </form>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNomineeDisable}
                    disabled={nomineeSubmitting || !nomineeStatus?.enabled}
                  >
                    Disable Nominee Access
                  </Button>
                  {nomineeMessage && (
                    <span className={`text-sm ${nomineeMessage.type === 'success' ? 'text-emerald-300' : 'text-red-400'}`}>
                      {nomineeMessage.text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {message && (
            <div className={`p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                {message.text}
            </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                <p className="text-gray-200">{profile.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Phone Number</p>
                <p className="text-gray-200">{profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">USDT (TRC20) Address</p>
                <p className="text-gray-200 break-all">{profile.usdtTrc20Address || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
              <CardTitle>Referral & Sponsor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Your Referral Code</p>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2">
                  <p className="font-mono text-lg flex-grow">{profile.referralCode}</p>
                  <Button size="sm" onClick={handleCopy} variant="ghost" className="text-emerald-200 hover:text-white">
                    <Copy className="h-4 w-4 mr-2" />
                    {copyText}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Original Sponsor ID</p>
                <p className="text-gray-200">{profile.originalSponsorId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Placement Parent ID</p>
                <p className="text-gray-200">{profile.parentId || 'N/A'}</p>
              </div>
              {profile.isSplitSponsor && (
                <p className="text-amber-400 text-xs font-semibold">This is a split sponsorship.</p>
              )}
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
