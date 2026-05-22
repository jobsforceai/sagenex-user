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
        <div className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:mb-12 sm:rounded-3xl sm:p-8">
            <h2 className="mb-1.5 flex items-center gap-2 text-lg font-black tracking-tight text-[#0F172A] sm:mb-4 sm:text-2xl">
                <UserPlus className="h-5 w-5 text-emerald-500 sm:h-6 sm:w-6" />
                Placement Queue
            </h2>
            <p className="mb-3 text-xs font-medium leading-relaxed text-[#64748B] sm:mb-6 sm:text-base">
                Sponsored users waiting for placement.
            </p>

            {message && (
                <div className={`mb-3 rounded-xl border px-3 py-2 text-xs font-bold sm:mb-4 sm:px-4 sm:py-3 sm:text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-2.5 sm:space-y-4">
                {queue.map(user => (
                    <div key={user.userId} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-[#0F172A] sm:text-base">{user.fullName}</h3>
                            <p className="mt-0.5 truncate text-xs font-medium text-[#64748B] sm:text-sm">{user.email}</p>
                            <p className="mt-0.5 text-[11px] font-bold text-slate-400 sm:text-sm">ID: {user.userId}</p>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:items-center sm:gap-4">
                            <button
                                onClick={() => { setTransferringUser(user); setMessage(null); }}
                                className="h-9 rounded-xl bg-sky-600 px-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(2,132,199,0.18)] hover:bg-sky-700 sm:h-auto sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Transfer
                            </button>
                            <button
                                onClick={() => { setSelectedUser(user); setMessage(null); }}
                                className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white shadow-[0_8px_20px_rgba(5,150,105,0.18)] hover:bg-emerald-700 sm:h-auto sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Place
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedUser && (

                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => { setSelectedUser(null); setDropdownVisible(false); }}>

                                <div className="rounded-3xl border border-slate-200/70 bg-white p-8 w-full max-w-md shadow-[0_25px_80px_rgba(15,23,42,0.18)]" onClick={e => e.stopPropagation()}>

                                    <h3 className="text-xl font-black tracking-tight text-[#0F172A] mb-2">Place {selectedUser.fullName}</h3>

                                    <p className="text-[#64748B] mb-6">

                                        Select a parent from your downline. This can be yourself or any member of your team.

                                    </p>

                                    <form onSubmit={handlePlaceUser}>

                                        {isLoadingOptions ? (

                                            <div className="text-center text-[#64748B]">Loading options...</div>

                                        ) : (

                                            <div className="relative">

                                                <input

                                                    type="text"

                                                    value={searchTerm}

                                                    onChange={handleSearchChange}

                                                    className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"

                                                    placeholder="Search by name or ID..."

                                                    onFocus={() => setDropdownVisible(true)}

                                                    autoComplete="off"

                                                />

                                                {dropdownVisible && filteredOptions.length > 0 && (

                                                    <div className="absolute z-10 w-full mt-1 rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.1)] max-h-60 overflow-y-auto">

                                                        {filteredOptions.map(option => (

                                                            <div

                                                                key={option.userId}

                                                                className="px-4 py-2 text-[#0F172A] cursor-pointer hover:bg-slate-50"

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

                                            <button type="button" onClick={() => { setSelectedUser(null); setDropdownVisible(false); }} className="h-11 px-5 rounded-xl border border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50">

                                                Cancel

                                            </button>

                                            <button type="submit" disabled={isSubmitting || isLoadingOptions || !placementParentId} className="h-11 px-5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-[0_10px_30px_rgba(5,150,105,0.25)]">

                                                {isSubmitting ? 'Placing...' : 'Confirm Placement'}

                                            </button>

                                        </div>

                                    </form>

                                </div>

                            </div>

                        )}

            {transferringUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setTransferringUser(null)}>
                    <div className="rounded-3xl border border-slate-200/70 bg-white p-8 w-full max-w-md shadow-[0_25px_80px_rgba(15,23,42,0.18)]" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-black tracking-tight text-[#0F172A] mb-2">Transfer {transferringUser.fullName}</h3>
                        <p className="text-[#64748B] mb-6">
                            Enter the User ID of the new sponsor. The user will be moved to their placement queue.
                        </p>
                        <form onSubmit={handleTransferUser}>
                            <input
                                type="text"
                                value={newSponsorId}
                                onChange={e => setNewSponsorId(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                                placeholder="Enter new Sponsor User ID"
                                required
                            />
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={() => setTransferringUser(null)} className="h-11 px-5 rounded-xl border border-slate-200 bg-white font-bold text-[#0F172A] hover:bg-slate-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting || !newSponsorId} className="h-11 px-5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 disabled:opacity-50 shadow-[0_10px_30px_rgba(2,132,199,0.25)]">
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
