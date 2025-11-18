"use client";

import { useState, useEffect } from 'react';
import { QueuedUser } from '@/types';
import { placeUser, getPlacementOptions, transferUser } from '@/actions/user';
import { UserPlus } from 'lucide-react';

interface PlacementOption {
    userId: string;
    fullName: string;
}

const PlacementQueue = ({ queue, onUserPlaced }: { queue: QueuedUser[], onUserPlaced: () => void }) => {
    const [selectedUser, setSelectedUser] = useState<QueuedUser | null>(null);
    const [transferringUser, setTransferringUser] = useState<QueuedUser | null>(null);
    const [placementParentId, setPlacementParentId] = useState('');
    const [newSponsorId, setNewSponsorId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [placementOptions, setPlacementOptions] = useState<PlacementOption[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<PlacementOption[]>([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);

    useEffect(() => {
        const fetchPlacementOptions = async () => {
            if (!selectedUser) return;

            setIsLoadingOptions(true);
            setPlacementOptions([]);
            setPlacementParentId('');

            try {
                const options = await getPlacementOptions();

                if (options.error) {
                    setMessage({ type: 'error', text: options.error });
                } else {
                    setPlacementOptions(options);
                    setFilteredOptions(options); // Initialize filtered options
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

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setPlacementParentId(''); // Reset if user is typing
        if (term) {
            setFilteredOptions(
                placementOptions.filter(option =>
                    option.fullName.toLowerCase().includes(term.toLowerCase()) ||
                    option.userId.toLowerCase().includes(term.toLowerCase())
                )
            );
        } else {
            setFilteredOptions(placementOptions);
        }
        setDropdownVisible(true);
    };

    const handleSelectOption = (option: PlacementOption) => {
        setSearchTerm(`${option.fullName} (${option.userId})`);
        setPlacementParentId(option.userId);
        setDropdownVisible(false);
    };


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

    const handleTransferUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferringUser || !newSponsorId) return;

        setIsSubmitting(true);
        setMessage(null);
        try {
            const result = await transferUser(transferringUser.userId, newSponsorId);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.message });
                setTransferringUser(null);
                setNewSponsorId('');
                onUserPlaced(); // Re-use the same callback to refresh
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
                                onClick={() => { setTransferringUser(user); setMessage(null); }}
                                className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500"
                            >
                                Transfer
                            </button>
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

                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setSelectedUser(null); setDropdownVisible(false); }}>

                                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>

                                    <h3 className="text-xl font-bold mb-2 text-white">Place {selectedUser.fullName}</h3>

                                    <p className="text-gray-400 mb-6">

                                        Select a parent from your downline. This can be yourself or any member of your team.

                                    </p>

                                    <form onSubmit={handlePlaceUser}>

                                        {isLoadingOptions ? (

                                            <div className="text-center text-gray-400">Loading options...</div>

                                        ) : (

                                            <div className="relative">

                                                <input

                                                    type="text"

                                                    value={searchTerm}

                                                    onChange={handleSearchChange}

                                                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"

                                                    placeholder="Search by name or ID..."

                                                    onFocus={() => setDropdownVisible(true)}

                                                    autoComplete="off"

                                                />

                                                {dropdownVisible && filteredOptions.length > 0 && (

                                                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">

                                                        {filteredOptions.map(option => (

                                                            <div

                                                                key={option.userId}

                                                                className="px-4 py-2 text-white cursor-pointer hover:bg-gray-700"

                                                                onClick={() => handleSelectOption(option)}

                                                            >

                                                                {option.fullName} ({option.userId})

                                                            </div>

                                                        ))}

                                                    </div>

                                                )}

                                            </div>

                                        )}

                                        <div className="mt-6 flex justify-end gap-4">

                                            <button type="button" onClick={() => { setSelectedUser(null); setDropdownVisible(false); }} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700">

                                                Cancel

                                            </button>

                                            <button type="submit" disabled={isSubmitting || isLoadingOptions || !placementParentId} className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50">

                                                {isSubmitting ? 'Placing...' : 'Confirm Placement'}

                                            </button>

                                        </div>

                                    </form>

                                </div>

                            </div>

                        )}

            {transferringUser && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setTransferringUser(null)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-2 text-white">Transfer {transferringUser.fullName}</h3>
                        <p className="text-gray-400 mb-6">
                            Enter the User ID of the new sponsor. The user will be moved to their placement queue.
                        </p>
                        <form onSubmit={handleTransferUser}>
                            <input
                                type="text"
                                value={newSponsorId}
                                onChange={e => setNewSponsorId(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Enter new Sponsor User ID"
                                required
                            />
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setTransferringUser(null)} className="px-4 py-2 rounded-md text-gray-300 hover:bg-gray-700">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting || !newSponsorId} className="px-4 py-2 rounded-md bg-sky-600 text-white font-semibold hover:bg-sky-500 disabled:opacity-50">
                                    {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
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
