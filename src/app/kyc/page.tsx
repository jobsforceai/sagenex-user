"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, CheckCircle2, ChevronDown, HelpCircle, Shield } from 'lucide-react';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Navbar from '../components/Navbar';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import KycWizardModal from '@/app/components/kyc/KycWizardModal';
import FaceVerificationPanel from '@/app/components/biometrics/FaceVerificationPanel';

const ProgressStepper = ({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) => {
    const steps = [
        { num: 1, label: 'Legal Agreement', description: 'Scan signed form' },
        { num: 2, label: 'ID Front', description: 'Scan front side' },
        { num: 3, label: 'ID Back', description: 'Scan back side' },
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
    const [capturedImages, setCapturedImages] = useState<Record<string, { dataUrl: string; blob: Blob } | null>>({
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
    const [showWizardModal, setShowWizardModal] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');

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
        setCaptureReady(false);
        setCaptureError(null);

        // Check if we're on HTTPS or localhost
        const isSecureContext = window.isSecureContext;
        const isHTTP = window.location.protocol === 'http:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!navigator.mediaDevices?.getUserMedia) {
            if (isHTTP && !isLocalhost) {
                throw new Error("Camera requires HTTPS. Please use a secure connection (https://) to access the camera.");
            }
            throw new Error("Camera access is not supported in this browser.");
        }

        if (!isSecureContext && !isLocalhost) {
            throw new Error("Camera requires HTTPS. Please access this page via https:// instead of http://");
        }

        if (captureStreamRef.current) {
            captureStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: cameraFacingMode },
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
        } else {
            throw new Error("Video element not available");
        }
    };

    const switchCamera = async () => {
        if (!captureReady) return;

        const newFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
        setCameraFacingMode(newFacingMode);

        // Stop current camera
        stopCaptureCamera();

        // Restart with new facing mode
        setCaptureReady(false);
        setCaptureError(null);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Camera access is not supported in this browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: newFacingMode },
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
        } catch (err: any) {
            setCaptureError(err?.message || "Failed to switch camera");
        }
    };

    useEffect(() => {
        setCaptureOpen(false);
        setCaptureError(null);
        stopCaptureCamera();
    }, [currentStep]);

    // Auto-start camera when capture panel opens
    useEffect(() => {
        if (captureOpen && !captureReady) {
            startCaptureCamera().catch((err) => {
                setCaptureError(err?.message || "Camera failed to start.");
            });
        }
    }, [captureOpen]);

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

    // Check if documents are captured (not yet uploaded)
    const hasLegalCaptured = capturedImages.LEGAL_AGREEMENT !== null;
    const hasFrontCaptured = capturedImages.ID_FRONT !== null;
    const hasBackCaptured = capturedImages.ID_BACK !== null;

    const completedSteps = new Set<number>();
    if (hasLegalCaptured) completedSteps.add(1);
    if (hasFrontCaptured) completedSteps.add(2);
    if (hasBackCaptured) completedSteps.add(3);

    const getNextStep = (status: KycStatus | null) => {
        if (!hasLegalCaptured) return 1;
        if (!hasFrontCaptured) return 2;
        if (!hasBackCaptured) return 3;
        return 3;
    };

    const currentDocType =
        currentStep === 1 ? 'LEGAL_AGREEMENT' : currentStep === 2 ? 'ID_FRONT' : currentStep === 3 ? 'ID_BACK' : null;

    const docMeta: Record<string, { label: string; description: string }> = {
        LEGAL_AGREEMENT: { label: 'Signed Legal Agreement', description: 'Scan your signed agreement' },
        ID_FRONT: { label: 'ID Front', description: 'Scan the front side of your ID' },
        ID_BACK: { label: 'ID Back', description: 'Scan the back side of your ID' },
    };

    const currentDoc = currentDocType ? docMeta[currentDocType] : null;
    const currentDocCaptured = currentDocType ? capturedImages[currentDocType] !== null : false;
    const currentDocFaceRequired = currentDocType ? FACE_REQUIRED_DOCS.has(currentDocType) : false;
    const faceBlocked = currentDocFaceRequired && !faceVerificationId;

    const allDocumentsCaptured = hasLegalCaptured && hasFrontCaptured && hasBackCaptured;

    const captureSnapshot = async (docType: string) => {
        if (!captureVideoRef.current) return;
        const video = captureVideoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) return;

        // Calculate crop dimensions to maintain 9:16 aspect ratio (portrait)
        const targetRatio = 9 / 16;
        const currentRatio = width / height;

        let cropWidth, cropHeight, cropX, cropY;

        if (currentRatio > targetRatio) {
            // Video is wider than target, crop width
            cropHeight = Math.round(height * 0.85); // 85% of height
            cropWidth = Math.round(cropHeight * targetRatio);
            cropX = Math.round((width - cropWidth) / 2);
            cropY = Math.round((height - cropHeight) / 2);
        } else {
            // Video is taller than target, crop height
            cropWidth = Math.round(width * 0.75); // 75% of width
            cropHeight = Math.round(cropWidth / targetRatio);
            cropX = Math.round((width - cropWidth) / 2);
            cropY = Math.round((height - cropHeight) / 2);
        }

        const canvas = document.createElement("canvas");
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const blob = await (await fetch(dataUrl)).blob();

        // Save captured image locally for preview
        setCapturedImages((prev) => ({ ...prev, [docType]: { dataUrl, blob } }));
        setPreviews((prev) => ({ ...prev, [docType]: dataUrl }));
        stopCaptureCamera();
    };

    const confirmCapture = (docType: string) => {
        setCaptureOpen(false);
        // Image is already saved in capturedImages, just close the capture panel
    };

    const retakeCapture = (docType: string) => {
        setCapturedImages((prev) => ({ ...prev, [docType]: null }));
        setPreviews((prev) => ({ ...prev, [docType]: null }));
        setCaptureOpen(false);
        // User can click "Capture Scan" again to retake
    };

    async function handleFinalSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            // Upload all captured documents
            const docTypes = ['LEGAL_AGREEMENT', 'ID_FRONT', 'ID_BACK'];

            for (const docType of docTypes) {
                const captured = capturedImages[docType];
                if (!captured) {
                    setMessage(`Please capture ${docMeta[docType].label}`);
                    setSubmitting(false);
                    return;
                }

                const formData = new FormData();
                formData.append("document", captured.blob, `${docType}.jpg`);
                formData.append("docType", docType);
                if (FACE_REQUIRED_DOCS.has(docType) && faceVerificationId) {
                    formData.append("faceVerificationId", faceVerificationId);
                }

                const uploadResult = await uploadKycDocument(formData);
                if (uploadResult.error) {
                    setMessage(`Failed to upload ${docMeta[docType].label}: ${uploadResult.error}`);
                    setSubmitting(false);
                    return;
                }
                setKycStatus(uploadResult.kyc);
            }

            // Submit for review after all uploads
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

            {/* Wizard Modal */}
            <KycWizardModal
                isOpen={showWizardModal}
                onClose={() => setShowWizardModal(false)}
                onComplete={(verificationId) => {
                    setFaceVerificationId(verificationId);
                    setShowWizardModal(false);
                }}
            />

            {kycStatus && kycStatus.status !== 'NOT_SUBMITTED' && kycStatus.status !== 'REJECTED' ? (
                <KycStatusDisplay status={kycStatus} />
            ) : (
                <div className="max-w-4xl mt-16 mx-auto">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl md:text-5xl pb-2 font-bold mb-4 bg-linear-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
                            KYC — Verify your identity
                        </h1>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            Complete face verification first, then upload your documents.
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
                        {/* Face Verification Status */}
                        <Card className="bg-black/30 border border-gray-800">
                            <CardContent className="p-6">
                                {faceVerificationId ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Face verification completed</h3>
                                                <p className="text-sm text-gray-400">You can now upload your documents</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <Shield className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white mb-2">Face verification required</h3>
                                                <p className="text-sm text-gray-400 mb-4">
                                                    Before uploading documents, we need to verify your identity. This quick 10-second process ensures it's really you.
                                                </p>
                                                <Button
                                                    onClick={() => setShowWizardModal(true)}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                                >
                                                    Start face verification
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Only show document upload if face is verified */}
                        {faceVerificationId && (
                            <>
                                <ProgressStepper currentStep={currentStep} completedSteps={completedSteps} />

                                {currentStep >= 1 && currentStep <= 3 && currentDocType && (
                                    <Card className="bg-black/30 border border-gray-800">
                                        <CardHeader>
                                            <CardTitle>{`Step ${currentStep}: ${docMeta[currentDocType].label}`}</CardTitle>
                                            <p className="text-sm text-gray-400">{docMeta[currentDocType].description}</p>
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

                                            <div className="rounded-xl border border-gray-800/80 bg-black/20 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-20 rounded-lg bg-gray-800/80 flex items-center justify-center overflow-hidden relative">
                                                        {previews[currentDocType] ? (
                                                            <Image src={previews[currentDocType] as string} alt="preview" layout="fill" objectFit="cover" />
                                                        ) : (
                                                            <div className="text-xs text-gray-400 text-center px-2">No snapshot</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-200">{docMeta[currentDocType].label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {currentDocCaptured ? "Captured - ready to submit" : "Ready to scan"}
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
                                                >
                                                    {captureOpen ? "Close Camera" : currentDocCaptured ? "Retake Scan" : "Capture Scan"}
                                                </Button>
                                            </div>

                                            {captureOpen && !currentDocCaptured && (
                                                <div className="rounded-xl border border-gray-800/80 bg-black/30 p-2 sm:p-4 space-y-3 sm:space-y-4">
                                                    <div className="relative w-full sm:max-w-md mx-auto" style={{ aspectRatio: '9/16' }}>
                                                        <div className="overflow-hidden rounded-lg border border-gray-800 bg-black h-full">
                                                            <video
                                                                ref={captureVideoRef}
                                                                className="absolute inset-0 h-full w-full object-cover"
                                                                autoPlay
                                                                muted
                                                                playsInline
                                                            />
                                                            {captureReady && (
                                                                <>
                                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                                        <div className="h-[85%] w-[75%] rounded-xl border-2 border-dashed border-emerald-400/60 bg-emerald-500/5" />
                                                                    </div>
                                                                    <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[11px] text-emerald-200">
                                                                        Align the document inside the box
                                                                    </div>
                                                                </>
                                                            )}
                                                            {!captureReady && !captureError && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                                                    <div className="text-center space-y-4">
                                                                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                                                        <p className="text-white">Starting camera...</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {captureError && (
                                                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                                            {captureError}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="w-full border-gray-700 text-gray-200 hover:bg-white/5 text-xs sm:text-sm py-2 sm:py-3"
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
                                                                variant="outline"
                                                                className="w-full border-gray-700 text-gray-200 hover:bg-white/5 text-xs sm:text-sm py-2 sm:py-3"
                                                                onClick={switchCamera}
                                                                disabled={!captureReady}
                                                            >
                                                                Switch Camera
                                                            </Button>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            className="w-full bg-emerald-600 text-white hover:bg-emerald-500 text-sm sm:text-base py-3 sm:py-3 font-semibold"
                                                            disabled={!captureReady}
                                                            onClick={() => captureSnapshot(currentDocType)}
                                                        >
                                                            Take Snapshot
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentDocCaptured && previews[currentDocType] && (
                                                <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3 sm:p-4 space-y-3 sm:space-y-4">
                                                    <div className="space-y-1 sm:space-y-2">
                                                        <h4 className="text-sm sm:text-base font-semibold text-emerald-200">Preview captured image</h4>
                                                        <p className="text-xs text-emerald-200/80">Review your scan before continuing</p>
                                                    </div>

                                                    <div className="relative w-full sm:max-w-md mx-auto rounded-lg overflow-hidden border-2 border-emerald-500/30" style={{ aspectRatio: '9/16' }}>
                                                        <Image
                                                            src={previews[currentDocType] as string}
                                                            alt="Captured preview"
                                                            layout="fill"
                                                            objectFit="contain"
                                                            className="bg-black"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full border-red-700 text-red-300 hover:bg-red-900/20 py-3"
                                                            onClick={() => retakeCapture(currentDocType)}
                                                        >
                                                            Retake
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentDocCaptured && currentStep < 3 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="w-full border-gray-800 text-gray-200 hover:bg-white/5 py-3 font-semibold"
                                                    onClick={() => setCurrentStep(currentStep + 1)}
                                                >
                                                    Continue to next document
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {currentStep === 3 && allDocumentsCaptured && (
                                    <div className="rounded-xl border border-emerald-700/30 bg-emerald-900/20 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-emerald-200">Ready to submit</h4>
                                                <p className="text-xs text-emerald-200/80">
                                                    All documents are captured. Click below to upload and submit for review.
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleFinalSubmit}
                                            disabled={!allDocumentsCaptured || submitting}
                                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {submitting ? 'Uploading and submitting...' : 'Upload & Submit for Review'}
                                            {!submitting && <CheckCircle2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {message && <div className="text-sm text-center text-emerald-300">{message}</div>}
                    </div>

                    <Collapsible open={isTutorialOpen} onOpenChange={setIsTutorialOpen} className="mt-4 sm:mt-6">
                        <CollapsibleTrigger className="w-full">
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 sm:p-4 hover:bg-gray-900/60 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                                        <div className="text-left">
                                            <h3 className="text-sm sm:text-base font-semibold text-white">Need Help? Watch Video Tutorial</h3>
                                            <p className="text-xs text-gray-400 hidden sm:block">Learn how to scan and upload documents properly</p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform shrink-0 ${isTutorialOpen ? 'rotate-180' : ''
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
