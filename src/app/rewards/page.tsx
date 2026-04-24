"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getRewards,
  getRewardPrograms,
  transferReward,
  getTransferRecipients,
  getProfileData,
  getKycStatus,
  getDashboardData,
} from "@/actions/user";
import { Reward, Recipient, KycStatus, RewardProgram } from "@/types";
import {
  CheckCircle,
  ArrowLeft,
  Loader2,
  Gift,
  Send,
  Info,
  FileClock,
  FileCheck,
  Lock,
  MapPin,
  Calendar,
  Ship,
  Plane,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RewardDocumentModal } from "@/app/components/rewards/RewardDocumentModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const TRAVEL_SHOWCASE_IDS = ["europe-trip-2026", "cruise-trip-2026"];

const TRAVEL_PROMO: Record<
  string,
  { lastDate: string; details: { label: string; value: string }[] }
> = {
  "europe-trip-2026": {
    lastDate: "April 10",
    details: [
      { label: "Destinations", value: "Paris, Amsterdam, Zurich, Rome, Switzerland" },
      { label: "Single Ticket", value: "₹20 Lakhs business" },
      { label: "Family Trip", value: "₹30 Lakhs business" },
    ],
  },
  "cruise-trip-2026": {
    lastDate: "April 10",
    details: [
      { label: "Travel Dates", value: "8th July to 11th July" },
      { label: "Duration", value: "3 Nights / 4 Days" },
      { label: "Route", value: "Vizag → Pondicherry → Chennai" },
      { label: "Qualification", value: "3 Lakhs business (Single Ticket)" },
    ],
  },
};

const PROGRAM_ICONS: Record<string, React.ReactNode> = {
  "europe-trip-2026": <Plane className="w-5 h-5" />,
  "cruise-trip-2026": <Ship className="w-5 h-5" />,
};

// ─── Showcase Card ───────────────────────────────────────────────────────────

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

const ShowcaseCard = ({ program }: { program: RewardProgram }) => {
  const promo = TRAVEL_PROMO[program.programId];
  const [imgError, setImgError] = useState(false);
  const rawHeroUrl = program.images?.heroImageUrl;
  const heroUrl = rawHeroUrl
    ? rawHeroUrl.startsWith("http") ? rawHeroUrl : `${BACKEND_URL}${rawHeroUrl}`
    : null;

  if (!promo) return null;

  return (
    <Card
      className="bg-gray-900/60 border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-emerald-700 transition-colors"
      onClick={() => {
        document
          .getElementById(`tracker-${program.programId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {/* Hero image or gradient fallback */}
      <div className="relative h-48 w-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {heroUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt={program.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl text-gray-600">
              {PROGRAM_ICONS[program.programId] ?? <Gift className="w-10 h-10" />}
            </span>
          </div>
        )}
        {/* Last date badge */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last Date: {promo.lastDate}
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">
            {PROGRAM_ICONS[program.programId]}
          </span>
          <h3 className="text-xl font-bold text-white">{program.name}</h3>
        </div>

        <div className="space-y-2">
          {promo.details.map((d) => (
            <div key={d.label} className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-gray-400">{d.label}:</span>{" "}
                <span className="text-white font-medium">{d.value}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-emerald-400/80 font-medium pt-1">
          Tap to view your progress ↓
        </p>
      </CardContent>
    </Card>
  );
};

// ─── Reward Tracker Card ─────────────────────────────────────────────────────

type ClaimStatus =
  | "NONE"
  | "PENDING"
  | "COMPLETED"
  | "DOCUMENTS_REQUIRED"
  | "DOCUMENTS_PENDING";

const RewardCard = ({
  reward,
  onTransfer,
  onUploadDocuments,
  recipients,
  kycStatus,
  isProgramLocked,
}: {
  reward: Reward;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
  recipients: Recipient[];
  kycStatus: KycStatus | null;
  isProgramLocked: boolean;
}) => {
  const wasReceived = !!reward.transferredFrom;

  const total = reward.rewardSnapshot?.valueUSD ?? 0;
  const current = reward.currentValueUSD ?? 0;
  const progress = wasReceived
    ? 100
    : Math.min(total > 0 ? (current / total) * 100 : 0, 100);

  const sender = reward.transferredFrom
    ? recipients.find((r) => r.userId === reward.transferredFrom)
    : null;

  const showTransferredStatus = reward.isTransferred;

  const renderStatus = () => {
    if (isProgramLocked && reward.claimStatus === "NONE" && !reward.isTransferred) {
      return (
        <div className="flex items-center justify-center gap-2 text-gray-400 font-semibold p-3 rounded-lg bg-gray-800/50">
          <Lock className="w-5 h-5" />
          Program Ended
        </div>
      );
    }

    switch (reward.claimStatus as ClaimStatus) {
      case "COMPLETED":
        return (
          <div className="flex items-center justify-center gap-2 text-green-400 font-semibold p-3 rounded-lg bg-green-900/50">
            <CheckCircle className="w-5 h-5" />
            Claimed Successfully
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold p-3 rounded-lg bg-yellow-900/50">
            <Loader2 className="w-5 h-5 animate-spin" />
            Pending Admin Approval
          </div>
        );
      case "DOCUMENTS_REQUIRED":
        return (
          <Button
            onClick={() => onUploadDocuments(reward)}
            className="w-full font-semibold bg-blue-600 hover:bg-blue-500"
            disabled={isProgramLocked}
          >
            <FileClock className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        );
      case "DOCUMENTS_PENDING":
        return (
          <div className="flex items-center justify-center gap-2 text-purple-400 font-semibold p-3 rounded-lg bg-purple-900/50">
            <FileCheck className="w-5 h-5" />
            Documents Pending Review
          </div>
        );
      case "NONE":
        if (showTransferredStatus) {
          return (
            <div className="flex items-center justify-center gap-2 text-gray-400 font-semibold p-3 rounded-lg bg-gray-800/50">
              <Send className="w-5 h-5" />
              Transferred
            </div>
          );
        }
        if (reward.isEligible) {
          return (
            <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold p-3 rounded-lg bg-yellow-900/50">
              <Loader2 className="w-5 h-5 animate-spin" />
              Pending Admin Approval
            </div>
          );
        }
        return (
          <div className="text-center text-sm text-gray-400 p-3 rounded-lg bg-gray-800/50">
            Keep going to unlock this reward!
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="bg-gray-900/40 border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      <CardHeader className="p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-white">
            {reward.rewardSnapshot.reward}
          </CardTitle>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
              reward.type === "self"
                ? "bg-blue-500/20 text-blue-300"
                : "bg-purple-500/20 text-purple-300"
            }`}
          >
            {reward.type} Business
          </span>
        </div>
        <p className="text-gray-400 flex items-center gap-2 pt-1">
          <Gift className="w-4 h-4 text-emerald-400" />
          Target: ₹{reward.rewardSnapshot.valueUSD.toLocaleString('en-IN')}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-300">Progress</span>
            <span className="font-semibold text-white">
              ₹{current.toLocaleString('en-IN')} / ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-emerald-500 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {wasReceived && (
          <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-900/50 p-2 rounded-md">
            <Info className="w-4 h-4" />
            <span>
              Received from {sender ? sender.fullName : "another user"}.
            </span>
          </div>
        )}

        <div className="mt-auto pt-4">{renderStatus()}</div>
      </CardContent>
    </Card>
  );
};

// ─── Transfer Modal ──────────────────────────────────────────────────────────

const TransferModal = ({
  reward,
  recipients,
  onClose,
  onConfirm,
}: {
  reward: Reward;
  recipients: Recipient[];
  onClose: () => void;
  onConfirm: (rewardId: string, recipientId: string) => Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  );
  const [isTransferring, setIsTransferring] = useState(false);

  const filteredRecipients = recipients.filter(
    (r) =>
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedRecipient) return;
    setIsTransferring(true);
    await onConfirm(reward._id, selectedRecipient.userId);
    setIsTransferring(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-2 text-white">Transfer Reward</h3>
        <p className="text-gray-400 mb-6">
          You are about to transfer the reward:{" "}
          <span className="font-semibold text-emerald-300">
            {reward.rewardSnapshot.reward}
          </span>
          . This action is irreversible.
        </p>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="recipient-search"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Search Recipient by Name or ID
            </label>
            <input
              id="recipient-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedRecipient(null);
              }}
              placeholder="Start typing to search..."
              className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-md">
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((r) => (
                <button
                  type="button"
                  key={r.userId}
                  onClick={() => {
                    setSelectedRecipient(r);
                    setSearchQuery(`${r.fullName} (${r.userId})`);
                  }}
                  className={`w-full text-left p-3 cursor-pointer hover:bg-gray-700 ${
                    selectedRecipient?.userId === r.userId
                      ? "bg-emerald-800"
                      : ""
                  }`}
                >
                  <p className="font-semibold">{r.fullName}</p>
                  <p className="text-sm text-gray-400">{r.userId}</p>
                </button>
              ))
            ) : (
              <p className="p-3 text-gray-500">No matching users found.</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isTransferring || !selectedRecipient}
          >
            {isTransferring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Tracker Section (per program) ───────────────────────────────────────────

const ProgramTracker = ({
  program,
  rewards,
  recipients,
  kycStatus,
  onTransfer,
  onUploadDocuments,
}: {
  program: RewardProgram;
  rewards: Reward[];
  recipients: Recipient[];
  kycStatus: KycStatus | null;
  onTransfer: (reward: Reward) => void;
  onUploadDocuments: (reward: Reward) => void;
}) => {
  const [activeType, setActiveType] = useState<"self" | "team">("self");
  const selfRewards = rewards.filter((r) => r.type === "self");
  const teamRewards = rewards.filter((r) => r.type === "team");
  const isLocked = program.status === "locked";

  const displayRewards = activeType === "self" ? selfRewards : teamRewards;

  return (
    <section id={`tracker-${program.programId}`} className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-emerald-400">
          {PROGRAM_ICONS[program.programId] ?? <Gift className="w-5 h-5" />}
        </span>
        <h2 className="text-2xl font-bold text-white">{program.name}</h2>
        {isLocked && (
          <span className="text-xs font-medium bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">
            Ended
          </span>
        )}
      </div>

      {/* Self / Team toggle */}
      <div className="flex border-b border-gray-800 mb-6">
        {selfRewards.length > 0 && (
          <button
            onClick={() => setActiveType("self")}
            className={`px-4 py-2 font-semibold transition-colors duration-200 ${
              activeType === "self"
                ? "border-b-2 border-blue-400 text-blue-300"
                : "text-gray-500 hover:text-white"
            }`}
          >
            Self Business
          </button>
        )}
        {teamRewards.length > 0 && (
          <button
            onClick={() => setActiveType("team")}
            className={`px-4 py-2 font-semibold transition-colors duration-200 ${
              activeType === "team"
                ? "border-b-2 border-purple-400 text-purple-300"
                : "text-gray-500 hover:text-white"
            }`}
          >
            Team Business
          </button>
        )}
      </div>

      {displayRewards.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayRewards.map((reward) => (
              <RewardCard
                key={reward._id}
                reward={reward}
                onTransfer={onTransfer}
                onUploadDocuments={onUploadDocuments}
                recipients={recipients}
                kycStatus={kycStatus}
                isProgramLocked={isLocked}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <p className="text-gray-500 text-sm py-4">
          No rewards for this program yet.
        </p>
      )}
    </section>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────

const RewardsPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [rewardsByProgram, setRewardsByProgram] = useState<
    Record<string, Reward[]>
  >({});
  const [programConfigs, setProgramConfigs] = useState<
    Record<string, RewardProgram>
  >({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [transferModalReward, setTransferModalReward] = useState<Reward | null>(
    null
  );
  const [uploadModalReward, setUploadModalReward] = useState<Reward | null>(
    null
  );
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [profileData, setProfileData] = useState<{ fullName?: string; profilePicture?: string; } | null>(null);
  const [rankData, setRankData] = useState<{ name?: string } | null>(null);
  const [walletData, setWalletData] = useState<{ availableBalance?: number } | null>(null);

  // Active travel programs from backend, filtered to showcase IDs
  const activePrograms = TRAVEL_SHOWCASE_IDS.map(
    (id) => programConfigs[id]
  ).filter(
    (p): p is RewardProgram => !!p && p.status === "active"
  );

  const fetchInitialData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [rewardsData, programsData, recipientsData, , kycData, dashboardData] =
        await Promise.all([
          getRewards(),
          getRewardPrograms(),
          getTransferRecipients(),
          getProfileData(),
          getKycStatus(),
          getDashboardData(),
        ]);

      if (kycData && "error" in kycData) setError(kycData.error as string);
      else setKycStatus(kycData as KycStatus);

      let configs: Record<string, RewardProgram> = {};
      if (programsData && "error" in programsData) {
        setError(programsData.error as string);
      } else {
        configs = (programsData as RewardProgram[]).reduce((acc, program) => {
          acc[program.programId] = program;
          return acc;
        }, {} as Record<string, RewardProgram>);
        setProgramConfigs(configs);
      }

      if (rewardsData && "error" in rewardsData) {
        setError(rewardsData.error as string);
      } else {
        const allRewards = (rewardsData || []) as Reward[];

        // Only include rewards for active travel programs
        const visibleRewards = allRewards.filter(
          (reward) =>
            TRAVEL_SHOWCASE_IDS.includes(reward.programId) &&
            configs[reward.programId]?.status === "active"
        );

        const grouped = visibleRewards.reduce((acc, reward) => {
          if (!acc[reward.programId]) acc[reward.programId] = [];
          acc[reward.programId].push(reward);
          return acc;
        }, {} as Record<string, Reward[]>);

        setRewardsByProgram(grouped);
      }

      if (recipientsData && "error" in recipientsData) {
        console.error("Could not load recipients:", recipientsData.error);
      } else {
        setRecipients(recipientsData as Recipient[]);
      }
      
      // Extract dashboard data for AppShell
      if (dashboardData && !dashboardData.error) {
        if (dashboardData.profile) {
          setProfileData(dashboardData.profile);
        }
        if (dashboardData.rank || dashboardData.performanceRank) {
          setRankData(dashboardData.rank || dashboardData.performanceRank);
        }
        if (dashboardData.wallet) {
          setWalletData(dashboardData.wallet);
        }
      }
    } catch (e) {
      setError("An unexpected error occurred while fetching data.");
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, authLoading, router, fetchInitialData]);

  const handleTransferReward = async (
    rewardId: string,
    recipientId: string
  ) => {
    setMessage(null);
    setError(null);
    try {
      const result = await transferReward(rewardId, recipientId);
      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setMessage(
          (result as { message: string }).message ?? "Reward transferred."
        );
        setTransferModalReward(null);
        fetchInitialData();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during transfer."
      );
    }
  };

  const handleRewardUpdate = (updatedReward: Reward) => {
    setUploadModalReward(updatedReward);
    setRewardsByProgram((prev) => {
      const updated = { ...prev };
      const program = updated[updatedReward.programId];
      if (program) {
        const index = program.findIndex((r) => r._id === updatedReward._id);
        if (index !== -1) {
          program[index] = updatedReward;
        }
      }
      return updated;
    });
  };

  if (authLoading || dataLoading) {
    return (
      <div className="bg-[#f8f9fa] text-[#0a0a0a] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-light-scope p-6 space-y-6">
        {/* <Button asChild variant="outline" className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button> */}

        <header className="text-center my-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 py-4 bg-linear-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            Travel Rewards
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Exclusive travel rewards for top performers. Track your progress and
            unlock your next adventure.
          </p>
        </header>

        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        {message && (
          <p className="text-green-400 text-center mb-4">{message}</p>
        )}

        {/* ── Showcase Section ─────────────────────────────────────────── */}
        {activePrograms.length > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePrograms.map((program) => (
                <ShowcaseCard key={program.programId} program={program} />
              ))}
            </div>
          </section>
        )}

        {/* ── Tracker Section ──────────────────────────────────────────── */}
        <div className="space-y-16">
          {activePrograms.length > 0 ? (
            activePrograms.map((program) => (
              <ProgramTracker
                key={program.programId}
                program={program}
                rewards={rewardsByProgram[program.programId] ?? []}
                recipients={recipients}
                kycStatus={kycStatus}
                onTransfer={setTransferModalReward}
                onUploadDocuments={(reward) => setUploadModalReward(reward)}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 text-lg">
              There are no active travel reward programs at this time.
            </p>
          )}
        </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {transferModalReward && (
        <TransferModal
          reward={transferModalReward}
          recipients={recipients}
          onClose={() => setTransferModalReward(null)}
          onConfirm={handleTransferReward}
        />
      )}

      {uploadModalReward && (
        <RewardDocumentModal
          reward={uploadModalReward}
          onClose={() => setUploadModalReward(null)}
          onRewardUpdate={handleRewardUpdate}
        />
      )}
      </div>
    </>
  );
};

export default RewardsPage;
