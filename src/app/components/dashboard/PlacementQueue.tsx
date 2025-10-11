"use client";

import { useState, useEffect } from 'react';
import { QueuedUser } from '@/types';
import { placeUser } from '@/actions/user';
import { Clock, UserPlus } from 'lucide-react';

const Countdown = ({ deadline }: { deadline: string }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(deadline) - +new Date();
        let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => (
        <span key={interval} className="text-sm font-mono">
            {String(value).padStart(2, '0')}{interval.charAt(0)}
        </span>
    ));

    return <div className="flex items-center gap-2">{timerComponents}</div>;
};

const PlacementQueue = ({ queue, onUserPlaced }: { queue: QueuedUser[], onUserPlaced: () => void }) => {
    const [selectedUser, setSelectedUser] = useState<QueuedUser | null>(null);
    const [placementParentId, setPlacementParentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
                You have 48 hours to place new users. If not placed, they will be automatically assigned.
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
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-yellow-400">
                                <Clock size={16} />
                                <Countdown deadline={user.placementDeadline} />
                            </div>
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
                            Enter the User ID of the parent. This can be your own ID or one of your directs.
                        </p>
                        <form onSubmit={handlePlaceUser}>
                            <input
                                type="text"
                                value={placementParentId}
                                onChange={e => setPlacementParentId(e.target.value)}
                                placeholder="Enter Parent User ID"
                                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                required
                            />
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setSelectedUser(null)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50">
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
