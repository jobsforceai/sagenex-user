"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, CheckCircle2, ChevronDown, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Navbar from '../components/Navbar';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';
import FaceVerificationPanel from '@/app/components/biometrics/FaceVerificationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProgressStepper = ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) => {
    const steps = [
        { num: 1, label: 'Face Verification', description: 'Verify once' },
        { num: 2, label: 'Legal Agreement', description: 'Scan signed form' },
        { num: 3, label: 'ID Front', description: 'Scan front side' },
        { num: 4, label: 'ID Back', description: 'Scan back side' },
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

const FACE_REQUIRED_DOCS = new Set(['ID_FRONT', 'ID_BACK']);

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [previews, setPreviews] = useState<Record<string, string | null>>({
        LEGAL_AGREEMENT: null,
        ID_FRONT: null,
        ID_BACK: null,
    });
    const [uploading, setUploading] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('telugu');
    const [faceVerificationId, setFaceVerificationId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [captureOpen, setCaptureOpen] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [captureReady, setCaptureReady] = useState(false);
    const captureVideoRef = React.useRef<HTMLVideoElement | null>(null);
    const captureStreamRef = React.useRef<MediaStream | null>(null);
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

    useEffect(() => {
        return () => {
            Object.values(previews).forEach((p) => p && URL.revokeObjectURL(p));
        };
    }, [previews]);

    useEffect(() => {
        return () => {
            if (captureStreamRef.current) {
                captureStreamRef.current.getTracks().forEach((track) => track.stop());
                captureStreamRef.current = null;
            }
        };
    }, []);

    const stopCaptureCamera = () => {
        if (captureStreamRef.current) {
            captureStreamRef.current.getTracks().forEach((track) => track.stop());
            captureStreamRef.current = null;
        }
        setCaptureReady(false);
    };

    const startCaptureCamera = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Camera access is not supported in this browser.");
        }
        if (captureStreamRef.current) {
            captureStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: false,
        });
        captureStreamRef.current = stream;
        if (captureVideoRef.current) {
            captureVideoRef.current.srcObject = stream;
            await new Promise<void>((resolve) => {
                if (!captureVideoRef.current) return resolve();
                captureVideoRef.current.onloadedmetadata = () => resolve();
            });
            await captureVideoRef.current.play();
            setCaptureReady(true);
        }
    };

    useEffect(() => {
        setCaptureOpen(false);
        setCaptureError(null);
        stopCaptureCamera();
    }, [currentStep]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading KYC status...</div>
            </div>
        )
    }

    const requiredDocs = ['LEGAL_AGREEMENT', 'ID_FRONT', 'ID_BACK'];
    const canSubmitForReview = kycStatus && requiredDocs.every(docType =>
        kycStatus.documents.some(d => d.docType === docType)
    );

    const isDocUploaded = (status: KycStatus | null, docType: string) =>
        Boolean(status?.documents.some((doc) => doc.docType === docType));

    const hasLegal = isDocUploaded(kycStatus, 'LEGAL_AGREEMENT');
    const hasFront = isDocUploaded(kycStatus, 'ID_FRONT');
    const hasBack = isDocUploaded(kycStatus, 'ID_BACK');

    const completedSteps = new Set<number>();
    if (faceVerificationId) completedSteps.add(1);
    if (hasLegal) completedSteps.add(2);
    if (hasFront) completedSteps.add(3);
    if (hasBack) completedSteps.add(4);

    const getNextStep = (status: KycStatus | null) => {
        if (!isDocUploaded(status, 'LEGAL_AGREEMENT')) return 2;
        if (!isDocUploaded(status, 'ID_FRONT')) return 3;
        if (!isDocUploaded(status, 'ID_BACK')) return 4;
        return 4;
    };

    const currentDocType =
        currentStep === 2 ? 'LEGAL_AGREEMENT' : currentStep === 3 ? 'ID_FRONT' : currentStep === 4 ? 'ID_BACK' : null;

    const docMeta: Record<string, { label: string; description: string }> = {
        LEGAL_AGREEMENT: { label: 'Signed Legal Agreement', description: 'Scan your signed agreement' },
        ID_FRONT: { label: 'ID Front', description: 'Scan the front side of your ID' },
        ID_BACK: { label: 'ID Back', description: 'Scan the back side of your ID' },
    };

    const currentDoc = currentDocType ? docMeta[currentDocType] : null;
    const currentDocUploaded = currentDocType ? isDocUploaded(kycStatus, currentDocType) : false;
    const currentDocFaceRequired = currentDocType ? FACE_REQUIRED_DOCS.has(currentDocType) : false;
    const faceBlocked = currentDocFaceRequired && !faceVerificationId;

    const captureSnapshot = async (docType: string) => {
        if (!captureVideoRef.current) return;
        const video = captureVideoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) return;
        const cropWidth = Math.round(width * 0.8);
        const cropHeight = Math.round(height * 0.7);
        const cropX = Math.round((width - cropWidth) / 2);
        const cropY = Math.round((height - cropHeight) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append("document", blob, `${docType}.jpg`);
        formData.append("docType", docType);
        if (FACE_REQUIRED_DOCS.has(docType) && faceVerificationId) {
            formData.append("faceVerificationId", faceVerificationId);
        }
        setUploading(docType);
        setMessage(null);
        try {
            const result = await uploadKycDocument(formData);
            if (result.error) {
                setMessage(`Upload failed: ${result.error}`);
            } else {
                setMessage(result.message);
                setKycStatus(result.kyc);
                setPreviews((prev) => ({ ...prev, [docType]: dataUrl }));
                setCaptureOpen(false);
                stopCaptureCamera();
                const nextStep = getNextStep(result.kyc);
                setCurrentStep(nextStep);
            }
        } catch {
            setMessage("An unexpected error occurred during upload.");
        } finally {
            setUploading(null);
        }
    };

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

    return (
        <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Navbar />
            {kycStatus && kycStatus.status !== 'NOT_SUBMITTED' && kycStatus.status !== 'REJECTED' ? (
                <KycStatusDisplay status={kycStatus} />
            ) : (
                <div className="max-w-4xl mt-16 mx-auto">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl pb-2 font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                            KYC — Verify your identity
                        </h1>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            Verify your face first, then scan the legal agreement and your ID front/back.
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

                        {currentStep === 1 && (
                            <Card className="bg-black/30 border border-gray-800">
                                <CardHeader>
                                    <CardTitle>Step 1: Face Verification</CardTitle>
                                    <p className="text-sm text-gray-400">
                                        Verify your face once to continue. We use this verification for both ID scans.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FaceVerificationPanel
                                        purpose="KYC"
                                        enrollHref="/face-test?mode=enroll&next=/kyc"
                                        onVerified={(passed) => {
                                            if (passed) {
                                                setCurrentStep(getNextStep(kycStatus));
                                            }
                                        }}
                                        onVerificationToken={(token) => setFaceVerificationId(token?.verificationId ?? null)}
                                    />
                                    {faceVerificationId && (
                                        <Button
                                            type="button"
                                            className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
                                            onClick={() => setCurrentStep(getNextStep(kycStatus))}
                                        >
                                            Continue to Scan
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {currentStep >= 2 && currentStep <= 4 && currentDocType && currentDoc && (
                            <Card className="bg-black/30 border border-gray-800">
                                <CardHeader>
                                    <CardTitle>{`Step ${currentStep}: ${currentDoc.label}`}</CardTitle>
                                    <p className="text-sm text-gray-400">{currentDoc.description}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {currentDocType === 'LEGAL_AGREEMENT' && (
                                        <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/30 p-4">
                                            <p className="text-sm text-emerald-200 mb-3">
                                                Download the agreement, sign it, then scan it here.
                                            </p>
                                            <a
                                                href="/withdrawal-agreement-form.pdf"
                                                download
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Download Agreement Form
                                            </a>
                                        </div>
                                    )}

                                    {currentDocFaceRequired && faceBlocked && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                            Face verification required before this scan.
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="ml-2 p-0 text-amber-100"
                                                onClick={() => {
                                                    setFaceVerificationId(null);
                                                    setCurrentStep(1);
                                                }}
                                            >
                                                Verify face
                                            </Button>
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-gray-800/80 bg-black/20 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-20 rounded-lg bg-gray-800/80 flex items-center justify-center overflow-hidden relative">
                                                {previews[currentDocType] ? (
                                                    <Image src={previews[currentDocType] as string} alt="preview" layout="fill" objectFit="cover" />
                                                ) : currentDocUploaded ? (
                                                    <CheckCircle className="text-green-400 w-8 h-8" />
                                                ) : (
                                                    <div className="text-xs text-gray-400 text-center px-2">No snapshot</div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-200">{currentDoc.label}</p>
                                                <p className="text-xs text-gray-500">
                                                    {currentDocUploaded ? "Already uploaded" : "Ready to scan"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-gray-700 text-gray-200 hover:bg-white/5 sm:w-auto"
                                            onClick={() => {
                                                setCaptureError(null);
                                                setCaptureOpen((prev) => {
                                                    const next = !prev;
                                                    if (!next) {
                                                        stopCaptureCamera();
                                                    }
                                                    return next;
                                                });
                                            }}
                                            disabled={faceBlocked}
                                        >
                                            {captureOpen ? "Close Camera" : currentDocUploaded ? "Retake Scan" : "Capture Scan"}
                                        </Button>
                                    </div>

                                    {captureOpen && (
                                        <div className="rounded-xl border border-gray-800/80 bg-black/30 p-4 space-y-4">
                                            {captureReady && (
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-800 bg-black">
                                                    <video
                                                        ref={captureVideoRef}
                                                        className="absolute inset-0 h-full w-full object-cover"
                                                        autoPlay
                                                        muted
                                                        playsInline
                                                    />
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="h-[70%] w-[80%] rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/5" />
                                                    </div>
                                                    <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-emerald-200">
                                                        Align the document inside the box
                                                    </div>
                                                </div>
                                            )}
                                            {captureError && (
                                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                                    {captureError}
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full border-gray-700 text-gray-200 hover:bg-white/5 sm:w-auto"
                                                    onClick={() => {
                                                        setCaptureError(null);
                                                        startCaptureCamera().catch((err) =>
                                                            setCaptureError(err?.message || "Camera failed to start.")
                                                        );
                                                    }}
                                                >
                                                    {captureReady ? "Camera Ready" : "Enable Camera"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="w-full bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
                                                    disabled={!captureReady || uploading !== null}
                                                    onClick={() => captureSnapshot(currentDocType)}
                                                >
                                                    {uploading ? "Uploading..." : "Take Snapshot"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {currentDocUploaded && currentStep < 4 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-gray-800 text-gray-200 hover:bg-white/5"
                                            onClick={() => setCurrentStep(currentStep + 1)}
                                        >
                                            Continue
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {currentStep === 4 && hasBack && (
                            <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/20 p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-emerald-200">Ready to submit</h4>
                                        <p className="text-xs text-emerald-200/80">
                                            All required scans are uploaded. Submit for admin review.
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
                        )}

                        {message && <div className="text-sm text-center text-emerald-300">{message}</div>}
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
