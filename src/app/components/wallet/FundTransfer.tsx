"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Recipient } from '@/types';
import { getTransferRecipients, sendTransferOtp, executeTransfer, getBiometricsStatus } from '@/actions/user';
import { ArrowRight, Send, Wallet, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import FaceVerificationPanel from '@/app/components/biometrics/FaceVerificationPanel';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type TransferType = 'TO_AVAILABLE_BALANCE' | 'TO_PACKAGE';
type VerificationMethod = 'face' | 'password' | 'otp';

const FundTransfer = ({ currentBalance, className }: { currentBalance: number; className?: string }) => {
    const { user, loading } = useAuth();
    const [allRecipients, setAllRecipients] = useState<Recipient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    
    const [amount, setAmount] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('face');
    const [lastNonFaceMethod, setLastNonFaceMethod] = useState<VerificationMethod>('otp');
    const [faceModalOpen, setFaceModalOpen] = useState(false);
    const [transferType, setTransferType] = useState<TransferType>('TO_AVAILABLE_BALANCE');
    const [step, setStep] = useState(1); // 1: Form, 2: Verification
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [faceEnrolled, setFaceEnrolled] = useState(false);
    const [faceVerificationId, setFaceVerificationId] = useState<string | null>(null);
    const [faceApproved, setFaceApproved] = useState(true);
    const [transferIdempotencyKey, setTransferIdempotencyKey] = useState<string | null>(null);
    const [transferCooldown, setTransferCooldown] = useState(0);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const otpTimerRef = useRef<NodeJS.Timeout | null>(null);
    const transferTimerRef = useRef<NodeJS.Timeout | null>(null);

    const TRANSFER_LOCK_KEY = 'transferLock';
    const TRANSFER_LOCK_MS = 120000;

    const getTransferFingerprint = () => {
        if (!selectedRecipient) return null;
        return `${selectedRecipient.userId}|${numericAmount}|${transferType}`;
    };

    const generateIdempotencyKey = () => {
        if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
            return crypto.randomUUID();
        }
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    };

    const getTransferLock = () => {
        try {
            const raw = localStorage.getItem(TRANSFER_LOCK_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { key: string; expiresAt: number };
            if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
                localStorage.removeItem(TRANSFER_LOCK_KEY);
                return null;
            }
            return parsed;
        } catch {
            localStorage.removeItem(TRANSFER_LOCK_KEY);
            return null;
        }
    };

    const setTransferLock = (key: string) => {
        const payload = { key, expiresAt: Date.now() + TRANSFER_LOCK_MS };
        localStorage.setItem(TRANSFER_LOCK_KEY, JSON.stringify(payload));
    };

    const numericAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
    const minPackageAmount = 50;
    const isAmountInvalid = useMemo(() => numericAmount > currentBalance, [numericAmount, currentBalance]);
    const remainingBalance = useMemo(() => currentBalance - numericAmount, [currentBalance, numericAmount]);
    const isBelowPackageMinimum =
        transferType === 'TO_PACKAGE' && numericAmount > 0 && numericAmount < minPackageAmount;

    const filteredRecipients = useMemo(() => {
        if (!searchTerm) return [];
        return allRecipients.filter(r => {
            if (!r.fullName || !r.userId) {
                return false;
            }
            return r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   r.userId.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [searchTerm, allRecipients]);

    useEffect(() => {
        const fetchRecipients = async () => {
            try {
                const data = await getTransferRecipients(true);
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

    const isSelfRecipient = selectedRecipient?.userId && selectedRecipient.userId === user?.userId;

    useEffect(() => {
        const otpCooldownEnd = localStorage.getItem('otpCooldownEnd');
        if (otpCooldownEnd) {
            const remainingTime = Math.ceil((Number(otpCooldownEnd) - Date.now()) / 1000);
            if (remainingTime > 0) {
                setOtpCooldown(remainingTime);
            }
        }
    }, []);
    
    useEffect(() => {
        if (otpCooldown > 0) {
            otpTimerRef.current = setTimeout(() => {
                setOtpCooldown(otpCooldown - 1);
            }, 1000);
        } else if (otpTimerRef.current) {
            clearTimeout(otpTimerRef.current);
        }
        return () => {
            if (otpTimerRef.current) {
                clearTimeout(otpTimerRef.current);
            }
        };
    }, [otpCooldown]);

    useEffect(() => {
        const updateCooldown = () => {
            const lock = getTransferLock();
            if (!lock) {
                setTransferCooldown(0);
                return;
            }
            const remaining = Math.max(0, Math.ceil((lock.expiresAt - Date.now()) / 1000));
            setTransferCooldown(remaining);
        };
        updateCooldown();
        transferTimerRef.current = setInterval(updateCooldown, 1000);
        return () => {
            if (transferTimerRef.current) {
                clearInterval(transferTimerRef.current);
            }
        };
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

    useEffect(() => {
        if (step === 2 && verificationMethod === 'face' && faceApproved) {
            setFaceModalOpen(true);
        }
    }, [step, verificationMethod, faceApproved]);

    const handleRecipientSelect = (recipient: Recipient) => {
        setSelectedRecipient(recipient);
        setSearchTerm(`${recipient.fullName} (${recipient.userId})`);
        setIsDropdownVisible(false);
        if (recipient.userId === user?.userId) {
            setTransferType('TO_PACKAGE');
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setSelectedRecipient(null);
        setIsDropdownVisible(true);
    };

    const effectiveRoiPlan = 'new' as const;

    const handleInitiateTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAmountInvalid || numericAmount <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        if (isBelowPackageMinimum) {
            toast.error(`Minimum ${minPackageAmount} USD required for package top-up.`);
            return;
        }
        if (!selectedRecipient) {
            toast.error('Please select a valid recipient from the list.');
            return;
        }
        if (selectedRecipient.userId === user?.userId && transferType !== 'TO_PACKAGE') {
            toast.error('Self top-up is only available for To Package transfers.');
            return;
        }
        if (faceEnrolled && faceApproved) {
            setVerificationMethod('face');
        } else if (user?.hasPasswordSet) {
            setVerificationMethod('password');
        } else {
            setVerificationMethod('otp');
        }
        setTransferIdempotencyKey(generateIdempotencyKey());
        setStep(2);
    };

    useEffect(() => {
        if (step !== 2) return;
        getBiometricsStatus()
            .then((res) => {
                if (!res?.error) {
                    setFaceEnrolled(Boolean(res.enrolled));
                    setFaceApproved(res.approved === undefined ? true : Boolean(res.approved));
                }
            })
            .catch(() => null);
    }, [step]);

    useEffect(() => {
        if (verificationMethod !== 'face') return;
        if (faceApproved) return;
        setVerificationMethod(user?.hasPasswordSet ? 'password' : 'otp');
    }, [faceApproved, verificationMethod, user?.hasPasswordSet]);

    const handleExecuteTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        const transferKey = getTransferFingerprint();
        const existingLock = getTransferLock();
        if (transferKey && existingLock?.key === transferKey) {
            toast.error('Transfer already in progress. Please wait a few seconds.');
            return;
        }
        if (verificationMethod === 'face' && faceEnrolled && !faceVerificationId) {
            toast.error('Please verify your face before completing the transfer.');
            return;
        }
        if (verificationMethod === 'otp' && (!otp || otp.length !== 6)) {
            toast.error('Please enter the 6-digit OTP.');
            return;
        }
        if (verificationMethod === 'password' && !password) {
            toast.error('Please enter your password.');
            return;
        }
        if (!selectedRecipient) {
            toast.error('Recipient not selected. Please go back.');
            return;
        }
        if (transferKey) {
            setTransferLock(transferKey);
        }
        setIsLoading(true);
        try {
            const result = await executeTransfer(
                selectedRecipient.userId,
                numericAmount,
                transferType,
                verificationMethod === 'password' ? password : undefined,
                verificationMethod === 'otp' ? otp : undefined,
                verificationMethod === 'face' ? faceVerificationId ?? undefined : undefined,
                transferIdempotencyKey ?? undefined,
                transferType === 'TO_PACKAGE' ? effectiveRoiPlan ?? undefined : undefined
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
                // Reset form state completely
                setStep(1);
                setSelectedRecipient(null);
                setSearchTerm('');
                setAmount('');
                setOtp('');
                setPassword('');
                setFaceVerified(false);
                setFaceVerificationId(null);
                setTransferIdempotencyKey(null);
                setTransferType('TO_AVAILABLE_BALANCE');
                // Reset auth method to default based on user preference
                if (faceEnrolled) {
                    setVerificationMethod('face');
                } else if (user?.hasPasswordSet) {
                    setVerificationMethod('password');
                } else {
                    setVerificationMethod('otp');
                }
            }
        } catch (error) {
            toast.error('An unexpected error occurred during transfer.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestOtp = async () => {
        setIsSendingOtp(true);
        try {
            const result = await sendTransferOtp();
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message);
                const cooldownEnd = Date.now() + 30000;
                localStorage.setItem('otpCooldownEnd', String(cooldownEnd));
                setOtpCooldown(30);
            }
        } catch (error) {
            toast.error('An unexpected error occurred while sending OTP.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={`bg-gray-900/40 border border-gray-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col ${className ?? ''}`}>
            {showConfetti && <Confetti width={500} height={500} />}
            {transferCooldown > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-sm text-amber-100 sm:text-xs">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-semibold">Transfer sent</span>
                    </div>
                    <p className="mt-1 text-amber-100/90">
                        Please wait {transferCooldown}s before sending another transfer.
                    </p>
                </div>
            )}
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                {/* <Send className="text-emerald-400" /> */}
                Transfer Funds
            </h2>
            <p className="text-gray-400 mb-6">
                Securely send funds to another user. Your transaction will be verified for security.
            </p>

            {step === 1 && (
                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-800/50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Wallet size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">Available Balance:</span>
                        </div>
                        <span className="font-semibold text-white">₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                        {r.fullName} ({r.userId}){r.userId === user?.userId ? " • You" : ""}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount (INR)</label>
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
                        <div className="text-xs text-gray-400 mt-1 min-h-5">
                            {transferType === 'TO_PACKAGE' && (
                                <span className="text-gray-500">Minimum ${minPackageAmount} for package transfers.</span>
                            )}
                            {numericAmount > 0 && !isAmountInvalid && !isBelowPackageMinimum && (
                                <span>Remaining Balance: ${remainingBalance.toFixed(2)}</span>
                            )}
                            {isAmountInvalid && <span className="text-red-400">Amount exceeds available balance.</span>}
                            {isBelowPackageMinimum && (
                                <span className="text-red-400">Amount must be at least ${minPackageAmount}.</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Transfer Destination</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => {
                                    if (isSelfRecipient) {
                                        toast.error('Self top-up must be sent to package.');
                                        return;
                                    }
                                    setTransferType('TO_AVAILABLE_BALANCE');
                                }}
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
                        {isSelfRecipient && (
                            <p className="text-xs text-emerald-300 mt-2">
                                Self top-up sends your available balance to your package.
                            </p>
                        )}
                    </div>


                    <button
                        type="submit"
                        disabled={isLoading || isAmountInvalid || isBelowPackageMinimum || numericAmount <= 0 || !selectedRecipient}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Proceeding...' : 'Proceed to Verification'}
                        <ArrowRight size={16} />
                    </button>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-4 space-y-3">
                        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Verification</p>
                        <div className="flex justify-center gap-2 p-1 rounded-lg bg-gray-800/50">
                            {faceApproved && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod('face');
                                        setFaceModalOpen(true);
                                    }}
                                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                                        verificationMethod === 'face' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    Use Face
                                </button>
                            )}
                            {user?.hasPasswordSet && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVerificationMethod('password');
                                        setLastNonFaceMethod('password');
                                        setFaceModalOpen(false);
                                    }}
                                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                                        verificationMethod === 'password' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    Use Password
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationMethod('otp');
                                    setLastNonFaceMethod('otp');
                                    setFaceModalOpen(false);
                                }}
                                className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                                    verificationMethod === 'otp' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                                }`}
                            >
                                Use OTP
                            </button>
                        </div>

                        {!faceEnrolled && (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                Enable face verification for extra security.
                                <button
                                    type="button"
                                    onClick={() => window.location.assign('/face-test?mode=enroll&next=/wallet')}
                                    className="ml-2 underline"
                                >
                                    Set up now
                                </button>
                            </div>
                        )}
                        {faceEnrolled && !faceApproved && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                Awaiting admin approval for face verification.
                            </div>
                        )}
                        {verificationMethod === 'face' && faceApproved && (
                            <Dialog
                                open={faceModalOpen}
                                onOpenChange={(open) => {
                                    setFaceModalOpen(open);
                                    if (!open) {
                                        setVerificationMethod(lastNonFaceMethod);
                                    }
                                }}
                            >
                                <DialogContent className="bg-gray-950 border-gray-800 p-4 sm:p-6 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <FaceVerificationPanel
                                        variant="modal"
                                        purpose="TRANSFER"
                                        enrollHref="/face-test?mode=enroll&next=/wallet"
                                        onVerified={(passed) => {
                                            setFaceVerified(passed);
                                            if (passed) {
                                                setFaceModalOpen(false);
                                            }
                                        }}
                                        onEnrollmentChange={(isEnrolled) => setFaceEnrolled(isEnrolled)}
                                        onVerificationToken={(token) =>
                                            setFaceVerificationId(token?.verificationId ?? null)
                                        }
                                        onApprovalChange={(approved) => setFaceApproved(approved)}
                                    />
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <form onSubmit={handleExecuteTransfer} className="space-y-4">
                        {verificationMethod === 'password' ? (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Enter Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Your password"
                                    className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        ) : verificationMethod === 'otp' ? (
                            <div className="space-y-2">
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">Enter OTP</label>
                                <div className="flex flex-col sm:flex-row gap-2">
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
                                    <button
                                        type="button"
                                        onClick={handleRequestOtp}
                                        disabled={isSendingOtp || otpCooldown > 0}
                                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold disabled:opacity-50 sm:w-48"
                                    >
                                        {isSendingOtp ? 'Sending...' : (otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Send OTP')}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setTransferIdempotencyKey(null); }}
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
                </div>
            )}
        </div>
    );
};

export default FundTransfer;
