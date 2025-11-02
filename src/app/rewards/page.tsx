"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRewards, claimReward, transferReward, getTransferRecipients, getProfileData } from "@/actions/user";
import { Reward, Recipient } from "@/types";
import { CheckCircle, Loader2, Gift, Send, Info } from "lucide-react";

const RewardCard = ({ reward, onClaim, onTransfer, recipients, currentUserId }: { reward: Reward; onClaim: (rewardId: string) => Promise<void>; onTransfer: (reward: Reward) => void; recipients: Recipient[]; currentUserId: string | null; }) => {
    const [isClaiming, setIsClaiming] = useState(false);
    
    const wasReceived = !!reward.transferredFrom && reward.userId === currentUserId;
    
    // If the reward was received, it's 100% complete for the recipient.
    const progress = wasReceived ? 100 : Math.min((reward.currentValueUSD / reward.offerSnapshot.valueUSD) * 100, 100);

    const sender = reward.transferredFrom ? recipients.find(r => r.userId === reward.transferredFrom) : null;

    const handleClaim = async () => {
        setIsClaiming(true);
        await onClaim(reward._id);
        setIsClaiming(false);
    };

    // A reward can be actioned only if the API confirms it's eligible and it hasn't been actioned yet.
    const canTakeAction = reward.isEligible && reward.claimStatus === 'NONE';

    // The "Transferred" status should only show if the user sent the reward to someone else.
    const showTransferredStatus = reward.isTransferred && reward.userId === currentUserId;

    return (
        <Card className="bg-gray-900/40 border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-white">{reward.offerSnapshot.name}</CardTitle>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${reward.offerSnapshot.type === 'personal' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {reward.offerSnapshot.type}
                    </span>
                </div>
                <p className="text-gray-400 flex items-center gap-2 pt-1">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    {reward.offerSnapshot.reward}
                </p>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-300">Progress</span>
                        <span className="font-semibold text-white">
                            ${reward.currentValueUSD.toLocaleString()} / ${reward.offerSnapshot.valueUSD.toLocaleString()}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {wasReceived && (
                    <div className="flex items-center gap-2 text-sm text-cyan-300 bg-cyan-900/50 p-2 rounded-md">
                        <Info className="w-4 h-4" />
                        <span>Received from {sender ? sender.fullName : 'another user'}.</span>
                    </div>
                )}

                <div className="mt-auto pt-4">
                    {reward.claimStatus === 'COMPLETED' ? (
                        <div className="flex items-center justify-center gap-2 text-green-400 font-semibold p-3 rounded-lg bg-green-900/50">
                            <CheckCircle className="w-5 h-5" />
                            Claimed
                        </div>
                    ) : reward.claimStatus === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold p-3 rounded-lg bg-yellow-900/50">
                            {/* <Loader2 className="w-5 h-5 animate-spin" /> */}
                            Claim in Progress (takes up to 24 hours)
                        </div>
                    ) : showTransferredStatus ? (
                        <div className="flex items-center justify-center gap-2 text-gray-400 font-semibold p-3 rounded-lg bg-gray-800/50">
                            <Send className="w-5 h-5" />
                            Transferred
                        </div>
                    ) : canTakeAction ? (
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => onTransfer(reward)} variant="outline" className="w-full font-semibold" disabled={wasReceived}>
                                <Send className="w-4 h-4 mr-2" />
                                Transfer
                            </Button>
                            <Button onClick={handleClaim} disabled={isClaiming} className="w-full font-semibold">
                                {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim'}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-400 p-3 rounded-lg bg-gray-800/50">
                            Keep going to unlock this reward!
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    const filteredRecipients = recipients.filter(r =>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2 text-white">Transfer Reward</h3>
                <p className="text-gray-400 mb-6">
                    You are about to transfer the reward: <span className="font-semibold text-emerald-300">{reward.offerSnapshot.name}</span>. This action is irreversible.
                </p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recipient-search" className="block text-sm font-medium text-gray-300 mb-1">Search Recipient by Name or ID</label>
                        <input
                            id="recipient-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedRecipient(null); // Clear selection when search changes
                            }}
                            placeholder="Start typing to search..."
                            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-md">
                        {filteredRecipients.length > 0 ? (
                            filteredRecipients.map(r => (
                                <div
                                    key={r.userId}
                                    onClick={() => {
                                        setSelectedRecipient(r);
                                        setSearchQuery(`${r.fullName} (${r.userId})`);
                                    }}
                                    className={`p-3 cursor-pointer hover:bg-gray-700 ${selectedRecipient?.userId === r.userId ? 'bg-emerald-800' : ''}`}
                                >
                                    <p className="font-semibold">{r.fullName}</p>
                                    <p className="text-sm text-gray-400">{r.userId}</p>
                                </div>
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
                    <Button onClick={handleConfirm} disabled={isTransferring || !selectedRecipient}>
                        {isTransferring ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Transfer'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


const RewardsPage = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [myProgressRewards, setMyProgressRewards] = useState<Reward[]>([]);
    const [receivedRewards, setReceivedRewards] = useState<Reward[]>([]);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchInitialData = async () => {
        try {
            const [rewardsData, recipientsData, profileData] = await Promise.all([
                getRewards(),
                getTransferRecipients(),
                getProfileData(),
            ]);

            if (rewardsData.error) {
                setError(rewardsData.error);
            } else {
                const progress: Reward[] = [];
                const received: Reward[] = [];
                for (const reward of rewardsData) {
                    if (reward.transferredFrom) {
                        received.push(reward);
                    } else {
                        progress.push(reward);
                    }
                }
                setMyProgressRewards(progress);
                setReceivedRewards(received);
            }

            if (recipientsData.error) {
                console.error("Could not load recipients:", recipientsData.error);
            } else {
                setRecipients(recipientsData);
            }

            if (profileData.error) {
                console.error("Could not load profile:", profileData.error);
            } else {
                setCurrentUserId(profileData.userId);
            }
        } catch {
            setError("An error occurred while fetching data.");
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }
        if (isAuthenticated) {
            fetchInitialData();
        }
    }, [isAuthenticated, authLoading, router]);

    const handleClaimReward = async (rewardId: string) => {
        setMessage(null);
        setError(null);
        try {
            const result = await claimReward(rewardId);
            if (result.error) {
                setError(result.error);
            } else {
                setMessage(result.message);
                fetchInitialData(); // Refresh all data
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during claim.");
        }
    };

    const handleTransferReward = async (rewardId: string, recipientId: string) => {
        setMessage(null);
        setError(null);
        try {
            const result = await transferReward(rewardId, recipientId);
            if (result.error) {
                setError(result.error);
            } else {
                setMessage(result.message);
                setSelectedReward(null); // Close modal on success
                fetchInitialData(); // Refresh all data
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during transfer.");
        }
    };

    if (authLoading || dataLoading) {
        return <div className="bg-black text-white min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="bg-black text-white min-h-screen">
            <Navbar />
            <main className="container mx-auto p-4 pt-24">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                        Rewards & Recognition
                    </h1>
                    <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                        Track your progress towards exclusive rewards based on your personal and team performance.
                    </p>
                </header>

                {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                {message && <p className="text-green-400 text-center mb-4">{message}</p>}

                <div className="space-y-12">
                    {/* My Progress Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-emerald-500 pb-2">My Progress</h2>
                        {myProgressRewards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myProgressRewards.map((reward) => (
                                    <RewardCard key={reward._id} reward={reward} onClaim={handleClaimReward} onTransfer={setSelectedReward} recipients={recipients} currentUserId={currentUserId} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">You have not made progress on any rewards yet.</p>
                        )}
                    </div>

                    {/* Received Rewards Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-cyan-500 pb-2">Received Rewards</h2>
                        {receivedRewards.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {receivedRewards.map((reward) => (
                                    <RewardCard key={reward._id} reward={reward} onClaim={handleClaimReward} onTransfer={setSelectedReward} recipients={recipients} currentUserId={currentUserId} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">You have not received any rewards from other users.</p>
                        )}
                    </div>
                </div>
            </main>

            {selectedReward && (
                <TransferModal
                    reward={selectedReward}
                    recipients={recipients}
                    onClose={() => setSelectedReward(null)}
                    onConfirm={handleTransferReward}
                />
            )}
        </div>
    );
};

export default RewardsPage;
