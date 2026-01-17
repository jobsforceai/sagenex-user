"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, UploadCloud, Check, CheckCircle2, Circle, ChevronDown, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Navbar from '../components/Navbar';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';

const ProgressStepper = ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) => {
    const steps = [
        { num: 1, label: 'Download Agreement', description: 'Get legal form' },
        { num: 2, label: 'Upload Documents', description: 'ID & bank proof' },
        { num: 3, label: 'Submit for Review', description: 'Final verification' },
    ];

    return (
        <div className="mb-6 sm:mb-8 px-2 sm:px-0">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center flex-1">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold mb-1 sm:mb-2 transition-all ${completedSteps.has(step.num)
                                    ? 'bg-emerald-500 text-white'
                                    : currentStep === step.num
                                        ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500'
                                        : 'bg-gray-800 text-gray-500'
                                }`}>
                                {completedSteps.has(step.num) ? (
                                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : (
                                    <span className="text-sm sm:text-base">{step.num}</span>
                                )}
                            </div>
                            <div className="text-center px-1">
                                <div className={`text-xs sm:text-sm font-semibold leading-tight ${completedSteps.has(step.num) || currentStep === step.num
                                        ? 'text-white'
                                        : 'text-gray-500'
                                    }`}>
                                    {step.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                                    {step.description}
                                </div>
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 sm:mx-2 mb-6 sm:mb-8 transition-all ${completedSteps.has(step.num) ? 'bg-emerald-500' : 'bg-gray-700'
                                }`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const KycStatusDisplay = ({ status }: { status: KycStatus }) => {
    const statusInfo = {
        PENDING: {
            icon: <Clock className="w-16 h-16 text-yellow-400" />,
            title: "KYC Submitted",
            message: "Your documents have been submitted and are pending review. This usually takes up to 48 hours.",
        },
        VERIFIED: {
            icon: <CheckCircle className="w-16 h-16 text-green-400" />,
            title: "KYC Verified",
            message: "Congratulations! Your identity has been successfully verified.",
        },
        REJECTED: {
            icon: <AlertTriangle className="w-16 h-16 text-red-400" />,
            title: "KYC Rejected",
            message: `Your KYC submission was rejected. Reason: ${status.rejectionReason}`,
        }
    };

    const currentStatus = status.status;
    if (currentStatus === 'NOT_SUBMITTED') return null;
    const { icon, title, message } = statusInfo[currentStatus];

    return (
        <div className="max-w-4xl mt-16 mx-auto text-center">
            <div className="flex justify-center mb-6">{icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">{message}</p>
        </div>
    )
}

const docSlots = [
    { label: 'Signed Legal Agreement', docType: 'LEGAL_AGREEMENT', accept: 'image/*,.pdf' },
    { label: 'Aadhaar Card (Front)', docType: 'AADHAAR_FRONT', accept: 'image/*,.pdf' },
    { label: 'Aadhaar Card (Back)', docType: 'AADHAAR_BACK', accept: 'image/*,.pdf' },
    { label: 'PAN Card', docType: 'PAN', accept: 'image/*,.pdf' },
    { label: 'Passbook / Canceled Cheque / Bank Statement', docType: 'OTHER', accept: 'image/*,.pdf' },
];

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<(File | null)[]>(Array(5).fill(null));
    const [previews, setPreviews] = useState<(string | null)[]>(Array(5).fill(null));
    const [uploading, setUploading] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('telugu');
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);

    const fetchKycStatus = async () => {
        try {
            const status = await getKycStatus();
            if (status && !status.error) {
                setKycStatus(status);
            } else {
                setMessage(status.error || "Could not load your KYC information.");
            }
        } catch (error) {
            console.error("Failed to fetch KYC status", error);
            setMessage("Could not load your KYC information.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setLoading(true);
        fetchKycStatus();
    }, []);

    function handleFileChange(index: number, f?: FileList | null) {
        const newFiles = [...files];
        const newPreviews = [...previews];
        newFiles[index] = f?.[0] ?? null;
        if (f?.[0]) {
            const file = f[0];
            if (file.type.startsWith('image/')) {
                if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
                newPreviews[index] = URL.createObjectURL(file);
            } else {
                if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
                newPreviews[index] = null;
            }
        } else {
            if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
            newPreviews[index] = null;
        }
        setFiles(newFiles);
        setPreviews(newPreviews);
    }

    async function handleUpload(index: number) {
        const file = files[index];
        if (!file) return;

        setUploading(index);
        setMessage(null);
        const formData = new FormData();
        formData.append('document', file);
        formData.append('docType', docSlots[index].docType);

        try {
            const result = await uploadKycDocument(formData);
            if (result.error) {
                setMessage(`Upload failed: ${result.error}`);
            } else {
                setMessage(result.message);
                setKycStatus(result.kyc); // Update status from response
                // Clear the staged file
                const newFiles = [...files];
                const newPreviews = [...previews];
                if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
                newFiles[index] = null;
                newPreviews[index] = null;
                setFiles(newFiles);
                setPreviews(newPreviews);
            }
        } catch (err) {
            setMessage('An unexpected error occurred during upload.');
            console.error(err);
        } finally {
            setUploading(null);
        }
    }

    async function handleFinalSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        try {
            const result = await submitKycForReview();
            if (result.error) {
                setMessage(result.error);
            } else {
                setMessage(result.message);
                setKycStatus(result.kyc);
            }
        } catch (err) {
            setMessage('An unexpected error occurred during submission.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        return () => {
            previews.forEach((p) => p && URL.revokeObjectURL(p));
        };
    }, [previews]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading KYC status...</div>
            </div>
        )
    }

    const requiredDocs = ['LEGAL_AGREEMENT', 'AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN'];
    const canSubmitForReview = kycStatus && requiredDocs.every(docType =>
        kycStatus.documents.some(d => d.docType === docType)
    );

    // Progress tracking
    const uploadedRequiredDocs = kycStatus?.documents.filter(d => requiredDocs.includes(d.docType)).length || 0;
    const totalRequiredDocs = requiredDocs.length;
    const progressPercentage = Math.round((uploadedRequiredDocs / totalRequiredDocs) * 100);

    // Stepper state
    const completedSteps = new Set<number>();
    let currentStep = 1;

    if (uploadedRequiredDocs > 0) {
        completedSteps.add(1); // Downloaded agreement (assumed if uploading docs)
        currentStep = 2;
    }
    if (canSubmitForReview) {
        completedSteps.add(2); // All docs uploaded
        currentStep = 3;
    }
    if (kycStatus?.status === 'PENDING' || kycStatus?.status === 'VERIFIED') {
        completedSteps.add(1);
        completedSteps.add(2);
        completedSteps.add(3);
    }

    return (
        <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Navbar />
            {kycStatus && kycStatus.status !== 'NOT_SUBMITTED' && kycStatus.status !== 'REJECTED' ? (
                <KycStatusDisplay status={kycStatus} />
            ) : (
                <div className="max-w-4xl mt-8 sm:mt-12 lg:mt-16 mx-auto">
                    <header className="text-center mb-6 sm:mb-8 px-2">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl pb-2 font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                            KYC — Verify your identity
                        </h1>
                        <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto px-2">
                            Complete the steps below to verify your identity and unlock full platform access.
                        </p>
                    </header>

                    <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />

                    {/* Progress Bar */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0 mb-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-300">Document Upload Progress</span>
                            <span className="text-xs sm:text-sm font-bold text-emerald-400">{uploadedRequiredDocs} / {totalRequiredDocs} Required</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                {progressPercentage > 10 && (
                                    <span className="text-[10px] font-bold text-white">{progressPercentage}%</span>
                                )}
                            </div>
                        </div>
                        {progressPercentage < 100 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Upload {totalRequiredDocs - uploadedRequiredDocs} more document{totalRequiredDocs - uploadedRequiredDocs !== 1 ? 's' : ''} to proceed
                            </p>
                        )}
                        {progressPercentage === 100 && (
                            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> All required documents uploaded! Ready to submit.
                            </p>
                        )}
                    </div>

                    {kycStatus?.status === 'REJECTED' && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl mb-6 text-center">
                            <h3 className="font-bold">Submission Rejected</h3>
                            <p>Reason: {kycStatus.rejectionReason}</p>
                            <p className="mt-2 text-sm">Please correct the issues by re-uploading the documents and resubmitting.</p>
                        </div>
                    )}

                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
                        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
                            <h3 className="font-bold text-base sm:text-lg text-emerald-300 mb-2">Step 1: Download and Sign the Legal Agreement</h3>
                            <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
                                Please download the legal agreement PDF, print it, sign it, and then scan or take a clear photo of the signed document. You will need to upload this in the next step.
                            </p>
                            <a
                                href="/withdrawal-agreement-form.pdf"
                                download
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm sm:text-base w-full sm:w-auto"
                            >
                                <FileText className="w-4 h-4" />
                                Download Agreement Form
                            </a>
                        </div>

                        <div className="grid gap-4 sm:gap-6">
                            {docSlots.map((slot, i) => {
                                const isUploaded = kycStatus?.documents.some(d => d.docType === slot.docType);
                                const isUploading = uploading === i;
                                const fileStaged = files[i];

                                return (
                                    <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gray-800/30 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-gray-800 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                            {previews[i] ? (
                                                <Image src={previews[i] as string} alt="preview" layout="fill" objectFit="cover" />
                                            ) : fileStaged && fileStaged.type === 'application/pdf' ? (
                                                <FileText className="text-emerald-300 w-8 h-8" />
                                            ) : isUploaded ? (
                                                <CheckCircle className="text-green-400 w-8 h-8" />
                                            ) : (
                                                <div className="text-xs text-gray-400 px-2 text-center">No file</div>
                                            )}
                                        </div>

                                        <div className="flex-1 w-full sm:w-auto">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                                <div className="text-sm font-medium text-gray-200">{slot.label}</div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {fileStaged ? (
                                                        <>
                                                            <div className="text-xs text-gray-300 max-w-[120px] sm:max-w-[150px] truncate">{fileStaged.name}</div>
                                                            <button
                                                                onClick={() => handleUpload(i)}
                                                                disabled={isUploading}
                                                                className="px-3 py-1.5 rounded-md bg-emerald-600/80 text-xs sm:text-sm text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                                                            >
                                                                <UploadCloud className="w-3 h-3 sm:w-4 sm:h-4" /> {isUploading ? 'Uploading...' : 'Upload'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileChange(i, null)}
                                                                className="px-3 py-1.5 rounded-md bg-red-600/20 text-xs sm:text-sm text-red-300 hover:bg-red-600/30"
                                                            >
                                                                Clear
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {isUploaded && <div className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3 sm:w-4 sm:h-4" /> Uploaded</div>}
                                                            <label className="cursor-pointer px-3 py-1.5 rounded-md bg-white/5 text-xs sm:text-sm text-white/90 hover:bg-white/10 whitespace-nowrap">
                                                                {isUploaded ? 'Re-upload' : 'Select File'}
                                                                <input
                                                                    type="file"
                                                                    accept={slot.accept}
                                                                    onChange={(e) => handleFileChange(i, e.target.files)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
                            {!canSubmitForReview && (
                                <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-semibold text-amber-300 mb-1">Required Documents Missing</h4>
                                        <p className="text-xs text-amber-200/80">
                                            Upload all {totalRequiredDocs} required documents before submitting for review.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {canSubmitForReview && (
                                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 flex items-start gap-2 sm:gap-3">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-semibold text-emerald-300 mb-1">Ready for Submission</h4>
                                        <p className="text-xs text-emerald-200/80">
                                            All required documents uploaded. Click below to submit for admin review.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                disabled={!canSubmitForReview || submitting}
                                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {submitting ? 'Submitting...' : 'Submit for Review'}
                                {!submitting && <CheckCircle2 className="w-5 h-5" />}
                            </button>
                        </div>

                        {message && <div className="text-sm mt-4 text-center text-emerald-300">{message}</div>}
                    </div>

                    <Collapsible open={isTutorialOpen} onOpenChange={setIsTutorialOpen} className="mt-4 sm:mt-6">
                        <CollapsibleTrigger className="w-full">
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 sm:p-4 hover:bg-gray-900/60 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                                        <div className="text-left">
                                            <h3 className="text-sm sm:text-base font-semibold text-white">Need Help? Watch Video Tutorial</h3>
                                            <p className="text-xs text-gray-400 hidden sm:block">Learn how to scan and upload documents properly</p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isTutorialOpen ? 'rotate-180' : ''
                                        }`} />
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="bg-gray-900/40 border border-gray-800 border-t-0 rounded-b-xl p-4 sm:p-6">
                                <div className="flex justify-center border-b border-gray-700 mb-4">
                                    <button onClick={() => setActiveTab('telugu')} className={`px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm ${activeTab === 'telugu' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>Telugu</button>
                                    <button onClick={() => setActiveTab('hindi')} className={`px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm ${activeTab === 'hindi' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>Hindi</button>
                                    <button onClick={() => setActiveTab('english')} className={`px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm ${activeTab === 'english' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>English</button>
                                </div>
                                <div className="aspect-w-16 aspect-h-9">
                                    <iframe
                                        src={
                                            activeTab === 'telugu' ? "https://www.youtube.com/embed/Kx53gpB6Uto" :
                                                activeTab === 'hindi' ? "https://www.youtube.com/embed/54KEU7Osk60" :
                                                    "https://www.youtube.com/embed/fo8UgBP8DEo"
                                        }
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-[250px] sm:h-[350px] rounded-lg"
                                    ></iframe>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            )}
        </div>
    );
}
