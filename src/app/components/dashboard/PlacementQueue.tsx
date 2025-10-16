"use client";

import { useState, useEffect } from 'react';
import { QueuedUser } from '@/types';
import { placeUser, getReferralSummary, getProfileData } from '@/actions/user';
import { UserPlus } from 'lucide-react';

interface PlacementOption {
    userId: string;
    fullName: string;
}

const PlacementQueue = ({ queue, onUserPlaced }: { queue: QueuedUser[], onUserPlaced: () => void }) => {
    const [selectedUser, setSelectedUser] = useState<QueuedUser | null>(null);
    const [placementParentId, setPlacementParentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [placementOptions, setPlacementOptions] = useState<PlacementOption[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
        const fetchPlacementOptions = async () => {
            if (!selectedUser) return;

            setIsLoadingOptions(true);
            setPlacementOptions([]);
            setPlacementParentId('');

            try {
                const [profileRes, summaryRes] = await Promise.all([
                    getProfileData(),
                    getReferralSummary()
                ]);

                let options: PlacementOption[] = [];
                if (profileRes && !profileRes.error) {
                    options.push({ userId: profileRes.userId, fullName: `${profileRes.fullName} (Myself)` });
                }

                if (summaryRes && summaryRes.referrals && !summaryRes.error) {
                    options = [...options, ...summaryRes.referrals];
                }

                setPlacementOptions(options);
                if (options.length > 0) {
                    setPlacementParentId(options[0].userId);
                }

            } catch (error) {
                setMessage({ type: 'error', text: 'Could not load placement options.' });
                console.error(error);
            } finally {
                setIsLoadingOptions(false);
            }
        };

        fetchPlacementOptions();
    }, [selectedUser]);


    const handlePlaceUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !placementParentId) return;

        setIsSubmitting(true);
        setMessage(null);
        try {
            const result = await placeUser(selectedUser.userId, placementParentId);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.message });
                setSelectedUser(null);
                setPlacementParentId('');
                onUserPlaced(); // Callback to refresh the queue
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (queue.length === 0) {
        return null; // Don't render the component if the queue is empty
    }

    return (
        <div className="mb-12 bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <UserPlus className="text-emerald-400" />
                Placement Queue
            </h2>
            <p className="text-gray-400 mb-6">
                Users you have sponsored who are waiting to be placed in your team tree.
            </p>

            {message && (
                <div className={`p-4 rounded-md mb-4 text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                {queue.map(user => (
                    <div key={user.userId} className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-white">{user.fullName}</h3>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user.userId}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => { setSelectedUser(user); setMessage(null); }}
                                className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
                            >
                                Place User
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-2 text-white">Place {selectedUser.fullName}</h3>
                        <p className="text-gray-400 mb-6">
                            Select a parent from the list. This can be yourself or one of your direct team members.
                        </p>
                        <form onSubmit={handlePlaceUser}>
                            {isLoadingOptions ? (
                                <div className="text-center text-gray-400">Loading options...</div>
                            ) : (
                                <select
                                    value={placementParentId}
                                    onChange={e => setPlacementParentId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                >
                                    {placementOptions.map(option => (
                                        <option key={option.userId} value={option.userId}>
                                            {option.fullName} ({option.userId})
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setSelectedUser(null)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting || isLoadingOptions || placementOptions.length === 0} className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50">
                                    {isSubmitting ? 'Placing...' : 'Confirm Placement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementQueue;
