"use client"

import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';
import AppShell from '../components/AppShell';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProgressStepper = ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) => {
    const steps = [
        { num: 1, label: 'Legal Agreement', description: 'Upload signed form' },
        { num: 2, label: 'ID Front', description: 'Upload front side' },
        { num: 3, label: 'ID Back', description: 'Upload back side' },
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

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
        LEGAL_AGREEMENT: null,
        ID_FRONT: null,
        ID_BACK: null,
    });

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

    if (loading) {
        return (
            <AppShell>
                <div className="dashboard-light-scope min-h-screen flex items-center justify-center">
                    <div>Loading KYC status...</div>
                </div>
            </AppShell>
        )
    }

    const requiredDocs = ['LEGAL_AGREEMENT', 'ID_FRONT', 'ID_BACK'];
    const canSubmitForReview = kycStatus && requiredDocs.every(docType =>
        kycStatus.documents.some(d => d.docType === docType)
    );

    const isDocUploaded = (status: KycStatus | null, docType: string) =>
        Boolean(status?.documents.some((doc) => doc.docType === docType));

    const docMeta: Record<string, { label: string; description: string }> = {
        LEGAL_AGREEMENT: { label: 'Signed Legal Agreement', description: 'Upload your signed agreement (PDF or image)' },
        ID_FRONT: { label: 'ID Front', description: 'Upload the front side of your ID' },
        ID_BACK: { label: 'ID Back', description: 'Upload the back side of your ID' },
    };

    const getCurrentStep = () => {
        if (!isDocUploaded(kycStatus, 'LEGAL_AGREEMENT')) return 1;
        if (!isDocUploaded(kycStatus, 'ID_FRONT')) return 2;
        if (!isDocUploaded(kycStatus, 'ID_BACK')) return 3;
        return 3;
    };

    const currentStep = getCurrentStep();
    const stepLabel = currentStep === 1 ? "Legal Agreement" : currentStep === 2 ? "ID Front" : "ID Back";
    const completedSteps = new Set<number>();
    if (isDocUploaded(kycStatus, 'LEGAL_AGREEMENT')) completedSteps.add(1);
    if (isDocUploaded(kycStatus, 'ID_FRONT')) completedSteps.add(2);
    if (isDocUploaded(kycStatus, 'ID_BACK')) completedSteps.add(3);

    const handleFileChange = (docType: string, file: File | null) => {
        setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
    };

    const handleUpload = async (docType: string) => {
        const file = selectedFiles[docType];
        if (!file) {
            setMessage(`Please select a file for ${docMeta[docType].label}`);
            return;
        }

        setUploading(docType);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("document", file, file.name);
            formData.append("docType", docType);

            const uploadResult = await uploadKycDocument(formData);
            if (uploadResult.error) {
                setMessage(`Failed to upload ${docMeta[docType].label}: ${uploadResult.error}`);
                return;
            }
            setKycStatus(uploadResult.kyc);
            setSelectedFiles((prev) => ({ ...prev, [docType]: null }));
        } catch (err) {
            console.error(err);
            setMessage("Failed to upload document. Please try again.");
        } finally {
            setUploading(null);
        }
    };

    const handleFinalSubmit = async () => {
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
            console.error(err);
            setMessage('An unexpected error occurred during submission.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell>
            <div className="dashboard-light-scope p-6">

            {kycStatus && kycStatus.status !== 'NOT_SUBMITTED' && kycStatus.status !== 'REJECTED' ? (
                <KycStatusDisplay status={kycStatus} />
            ) : (
                <div className="max-w-4xl mt-16 mx-auto">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl pb-2 font-bold mb-4 bg-linear-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                            KYC — Verify your identity
                        </h1>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            Upload your documents to complete KYC verification.
                        </p>
                    </header>

                    {kycStatus?.status === 'REJECTED' && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl mb-6 text-center">
                            <h3 className="font-bold">Submission Rejected</h3>
                            <p>Reason: {kycStatus.rejectionReason}</p>
                            <p className="mt-2 text-sm">Please correct the issues by re-uploading the documents and resubmitting.</p>
                        </div>
                    )}

                    <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
                        <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />
                        <div className="rounded-xl border border-gray-800/70 bg-black/30 px-4 py-3 text-sm text-gray-300">
                            Next step: <span className="text-emerald-300 font-semibold">{stepLabel}</span>
                        </div>

                        {requiredDocs.map((docType) => {
                            const uploaded = isDocUploaded(kycStatus, docType);
                            const stepNumber = docType === "LEGAL_AGREEMENT" ? 1 : docType === "ID_FRONT" ? 2 : 3;
                            return (
                                <Card key={docType} className="bg-black/30 border border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center justify-center rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                                                Step {stepNumber}
                                            </span>
                                            {docMeta[docType].label}
                                        </CardTitle>
                                        <p className="text-sm text-gray-400">{docMeta[docType].description}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {docType === "LEGAL_AGREEMENT" && (
                                            <div className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-3 text-sm text-emerald-100">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <span>Download, sign, then upload the agreement.</span>
                                                    <a
                                                        href="/withdrawal-agreement-form.pdf"
                                                        download
                                                        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        Download Agreement
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${uploaded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                                                    {uploaded ? 'Uploaded' : 'Not uploaded'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-gray-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-gray-200 hover:file:bg-gray-700"
                                                    onChange={(e) => handleFileChange(docType, e.target.files?.[0] ?? null)}
                                                />
                                                <Button
                                                    type="button"
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                                    onClick={() => handleUpload(docType)}
                                                    disabled={uploading === docType}
                                                >
                                                    {uploading === docType ? 'Uploading...' : uploaded ? 'Re-upload' : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/20 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-emerald-200">Submit for review</h4>
                                    <p className="text-xs text-emerald-200/80">
                                        Upload all three documents, then submit for admin review.
                                    </p>
                                </div>
                            </div>
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

                        {message && <div className="text-sm text-center text-emerald-300">{message}</div>}
                    </div>
                </div>
            )}
            </div>
        </AppShell>
    );
}
