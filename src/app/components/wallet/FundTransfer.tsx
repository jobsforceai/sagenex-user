"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Recipient } from '@/types';
import { getTransferRecipients, sendTransferOtp, executeTransfer } from '@/actions/user';
import { ArrowRight, Send, CheckCircle, AlertTriangle, Wallet, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import Confetti from 'react-confetti';

type TransferType = 'TO_AVAILABLE_BALANCE' | 'TO_PACKAGE';

const FundTransfer = ({ currentBalance }: { currentBalance: number }) => {
    const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    const [amount, setAmount] = useState('');
    const [otp, setOtp] = useState('');
    const [transferType, setTransferType] = useState<TransferType>('TO_AVAILABLE_BALANCE');
    const [step, setStep] = useState(1); // 1: Form, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    const numericAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
    const isAmountInvalid = useMemo(() => numericAmount > currentBalance, [numericAmount, currentBalance]);
    const remainingBalance = useMemo(() => currentBalance - numericAmount, [currentBalance, numericAmount]);

    const filteredRecipients = useMemo(() => {
        if (!searchTerm) return [];
        return allRecipients.filter(r =>
            r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.userId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allRecipients]);

    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                const data = await getTransferRecipients();
                if (data.error) {
                    toast.error(`Could not load recipients: ${data.error}`);
                } else {
                    setAllRecipients(data);
                }
            } catch (error) {
                toast.error('An unexpected error occurred while fetching recipients.');
                console.error(error);
            }
        };
        fetchRecipients();
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRecipientSelect = (recipient: Recipient) => {
        setSelectedRecipient(recipient);
        setSearchTerm(`${recipient.fullName} (${recipient.userId})`);
        setIsDropdownVisible(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedRecipient(null);
        setIsDropdownVisible(true);
    };

    const handleInitiateTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAmountInvalid || numericAmount <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        if (!selectedRecipient) {
            toast.error('Please select a valid recipient from the list.');
            return;
        }
        setIsLoading(true);
        try {
            const result = await sendTransferOtp();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                setStep(2);
            }
        } catch (error) {
            toast.error('An unexpected error occurred.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP.');
            return;
        }
        if (!selectedRecipient) {
            toast.error('Recipient not selected. Please go back.');
            return;
        }
        setIsLoading(true);
        try {
            const result = await executeTransfer(selectedRecipient.userId, numericAmount, otp, transferType);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
                setStep(1);
                setSelectedRecipient(null);
                setSearchTerm('');
                setAmount('');
                setOtp('');
                setTransferType('TO_AVAILABLE_BALANCE');
            }
        } catch (error) {
            toast.error('An unexpected error occurred.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 relative overflow-hidden">
            {showConfetti && <Confetti width={500} height={500} />}
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <Send className="text-emerald-400" />
                Transfer Funds
            </h2>
            <p className="text-gray-400 mb-6">
                Securely send funds to another user. An OTP will be sent to your email to confirm the transaction.
            </p>

            {step === 1 && (
                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">Available Balance:</span>
                        </div>
                        <span className="font-semibold text-white">${currentBalance.toFixed(2)}</span>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <label htmlFor="recipient-search" className="block text-sm font-medium text-gray-300 mb-1">Recipient</label>
                        <input
                            id="recipient-search"
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsDropdownVisible(true)}
                            placeholder="Search by name or user ID"
                            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            autoComplete="off"
                        />
                        {isDropdownVisible && filteredRecipients.length > 0 && (
                            <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredRecipients.map(r => (
                                    <li
                                        key={r.userId}
                                        onClick={() => handleRecipientSelect(r)}
                                        className="px-4 py-2 text-white hover:bg-emerald-600 cursor-pointer"
                                    >
                                        {r.fullName} ({r.userId})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount (USD)</label>
                        <input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className={`w-full px-4 py-2 rounded-md bg-gray-800 border ${isAmountInvalid ? 'border-red-500' : 'border-gray-600'} text-white focus:outline-none focus:ring-2 ${isAmountInvalid ? 'focus:ring-red-500' : 'focus:ring-emerald-500'}`}
                            required
                            min="0.01"
                            step="0.01"
                        />
                        <div className="text-xs text-gray-400 mt-1 h-4">
                            {numericAmount > 0 && !isAmountInvalid && `Remaining Balance: ${remainingBalance.toFixed(2)}`}
                            {isAmountInvalid && <span className="text-red-400">Amount exceeds available balance.</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Transfer Destination</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => setTransferType('TO_AVAILABLE_BALANCE')}
                                className={`flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer transition-all duration-200 text-white
                                    ${transferType === 'TO_AVAILABLE_BALANCE'
                                        ? 'bg-gray-700 border-gray-500'
                                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'}
                                    border-2`}
                            >

                                <Wallet className="mb-2 h-6 w-6" />
                                <span className="font-semibold text-base">To Balance</span>
                                <span className="text-xs text-center mt-1 text-gray-400">For withdrawals & spending</span>
                            </div>
                            <div
                                onClick={() => setTransferType('TO_PACKAGE')}
                                className={`flex flex-col items-center justify-center p-1 rounded-lg cursor-pointer transition-all duration-200 text-white
                                    ${transferType === 'TO_PACKAGE'
                                        ? 'bg-gray-700 border-gray-500'
                                        : 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'}
                                    border-2`}
                            >
                                <Briefcase className="mb-2 h-6 w-6" />
                                <span className="font-semibold text-base">To Package</span>
                                <span className="text-xs text-center mt-1 text-gray-400">For package upgrades</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isAmountInvalid || numericAmount <= 0 || !selectedRecipient}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send OTP'}
                        <ArrowRight size={16} />
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleExecuteTransfer} className="space-y-4">
                    <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">Enter OTP</label>
                        <input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                            maxLength={6}
                        />
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => { setStep(1); }}
                            className="w-full px-5 py-3 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                        >
                            {isLoading ? 'Transferring...' : 'Complete Transfer'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FundTransfer;