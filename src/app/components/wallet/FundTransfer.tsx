"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Recipient } from '@/types';
import { getTransferRecipients, sendTransferOtp, executeTransfer } from '@/actions/user';
import { ArrowRight, Send, CheckCircle, AlertTriangle, Wallet } from 'lucide-react';

const FundTransfer = ({ currentBalance }: { currentBalance: number }) => {
    const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    const [amount, setAmount] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Form, 2: OTP
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
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
                    setMessage({ type: 'error', text: `Could not load recipients: ${data.error}` });
                } else {
                    setAllRecipients(data);
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'An unexpected error occurred while fetching recipients.' });
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
            setMessage({ type: 'error', text: 'Please enter a valid amount.' });
            return;
        }
        if (!selectedRecipient) {
            setMessage({ type: 'error', text: 'Please select a valid recipient from the list.' });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        try {
            const result = await sendTransferOtp();
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.message });
                setStep(2);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter the 6-digit OTP.' });
            return;
        }
        if (!selectedRecipient) {
            setMessage({ type: 'error', text: 'Recipient not selected. Please go back.' });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        try {
            const result = await executeTransfer(selectedRecipient.userId, numericAmount, otp);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: `${result.message} Transaction ID: ${result.transactionId}` });
                setStep(1);
                setSelectedRecipient(null);
                setSearchTerm('');
                setAmount('');
                setOtp('');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred.' });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                <Send className="text-emerald-400" />
                Transfer Funds
            </h2>
            <p className="text-gray-400 mb-6">
                Securely send funds to another user. An OTP will be sent to your email to confirm the transaction.
            </p>

            {message && (
                <div className={`p-4 rounded-md mb-6 text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                    {message.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                    {message.text}
                </div>
            )}

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
                            {numericAmount > 0 && !isAmountInvalid && `Remaining Balance: $${remainingBalance.toFixed(2)}`}
                            {isAmountInvalid && <span className="text-red-400">Amount exceeds available balance.</span>}
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
                            onClick={() => { setStep(1); setMessage(null); }}
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