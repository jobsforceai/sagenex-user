"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import Image from 'next/image';
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
    // For legal agreement, we need 2 pages
    const [legalPage1, setLegalPage1] = useState<{ dataUrl: string; blob: Blob } | null>(null);
    const [legalPage2, setLegalPage2] = useState<{ dataUrl: string; blob: Blob } | null>(null);
    const [currentLegalPage, setCurrentLegalPage] = useState<1 | 2>(1);
    
    const [uploading, setUploading] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [faceVerificationId, setFaceVerificationId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [captureOpen, setCaptureOpen] = useState(false);
    const [captureError, setCaptureError] = useState<string | null>(null);
    const [captureReady, setCaptureReady] = useState(false);
    const captureVideoRef = React.useRef<HTMLVideoElement | null>(null);
    const captureStreamRef = React.useRef<MediaStream | null>(null);
    const [showWizardModal, setShowWizardModal] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
    const [autoCapture, setAutoCapture] = useState(true);
    const [documentDetected, setDocumentDetected] = useState(false);
    const [detectionCountdown, setDetectionCountdown] = useState<number | null>(null);
    const detectionIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    const detectionCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const detectedQuadRef = React.useRef<Array<{ x: number; y: number }> | null>(null);
    const [detectedQuad, setDetectedQuad] = useState<Array<{ x: number; y: number }> | null>(null);
    const [videoDims, setVideoDims] = useState<{ width: number; height: number } | null>(null);
    const [opencvLoaded, setOpencvLoaded] = React.useState(false);
    const cvRef = React.useRef<any>(null);

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

    // Load OpenCV.js
    useEffect(() => {
        const loadOpenCV = async () => {
            try {
                const script = document.createElement('script');
                script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
                script.async = true;
                script.onload = () => {
                    // @ts-ignore
                    if (window.cv) {
                        // @ts-ignore
                        cvRef.current = window.cv;
                        setOpencvLoaded(true);
                        console.log('OpenCV.js loaded successfully');
                    }
                };
                document.body.appendChild(script);
            } catch (error) {
                console.error('Failed to load OpenCV.js:', error);
            }
        };
        loadOpenCV();
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
        stopDocumentDetection();
    };

    const stopDocumentDetection = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setDocumentDetected(false);
        setDetectionCountdown(null);
        detectedQuadRef.current = null;
        setDetectedQuad(null);
    };

    const orderQuadPoints = (points: Array<{ x: number; y: number }>) => {
        if (points.length !== 4) return null;
        const sum = points.map((p) => p.x + p.y);
        const diff = points.map((p) => p.y - p.x);
        const tl = points[sum.indexOf(Math.min(...sum))];
        const br = points[sum.indexOf(Math.max(...sum))];
        const tr = points[diff.indexOf(Math.min(...diff))];
        const bl = points[diff.indexOf(Math.max(...diff))];
        return [tl, tr, br, bl];
    };

    const extractQuadPoints = (approx: any) => {
        const data = approx.data32S;
        if (!data || data.length < 8) return null;
        const points = [
            { x: data[0], y: data[1] },
            { x: data[2], y: data[3] },
            { x: data[4], y: data[5] },
            { x: data[6], y: data[7] },
        ];
        return orderQuadPoints(points);
    };

    const isLegalAspectRatio = (quad: Array<{ x: number; y: number }>) => {
        if (quad.length !== 4) return true;
        const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
            Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const [tl, tr, br, bl] = quad;
        const width = Math.max(dist(tl, tr), dist(bl, br));
        const height = Math.max(dist(tl, bl), dist(tr, br));
        if (!width || !height) return true;
        const ratio = width / height;
        return ratio >= 0.6 && ratio <= 0.85; // Rough A4-ish range
    };

    const detectDocument = () => {
        if (!captureVideoRef.current || !captureReady || !opencvLoaded || !cvRef.current) return false;
        
        try {
            const cv = cvRef.current;
            const video = captureVideoRef.current;
            const width = video.videoWidth;
            const height = video.videoHeight;
            if (!width || !height) return false;

            // Create canvas for processing
            if (!detectionCanvasRef.current) {
                detectionCanvasRef.current = document.createElement('canvas');
            }
            const canvas = detectionCanvasRef.current;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            // Draw current frame
            ctx.drawImage(video, 0, 0, width, height);

            // Convert to OpenCV Mat
            const src = cv.imread(canvas);
            const gray = new cv.Mat();
            const blur = new cv.Mat();
            const edges = new cv.Mat();
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();

            // Convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            // Apply Gaussian blur to reduce noise
            cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
            
            // Canny edge detection
            cv.Canny(blur, edges, 50, 150);
            
            // Find contours
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // Look for rectangular contours
            let maxArea = 0;
            let documentFound = false;
            let bestQuad: Array<{ x: number; y: number }> | null = null;
            const minArea = (width * height) * 0.1; // Document should be at least 10% of frame
            const maxAreaThreshold = (width * height) * 0.9; // But not more than 90%
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > minArea && area < maxAreaThreshold && area > maxArea) {
                    const peri = cv.arcLength(contour, true);
                    const approx = new cv.Mat();
                    cv.approxPolyDP(contour, approx, 0.02 * peri, true);
                    
                    // Check if it's a quadrilateral (4 corners)
                    if (approx.rows === 4) {
                        const quad = extractQuadPoints(approx);
                        maxArea = area;
                        if (quad && (currentDocType !== 'LEGAL_AGREEMENT' || isLegalAspectRatio(quad))) {
                            documentFound = true;
                            bestQuad = quad;
                        }
                    }
                    approx.delete();
                }
                contour.delete();
            }
            
            // Cleanup
            src.delete();
            gray.delete();
            blur.delete();
            edges.delete();
            contours.delete();
            hierarchy.delete();
            
            if (documentFound && bestQuad) {
                detectedQuadRef.current = bestQuad;
                setDetectedQuad((prev) => {
                    if (!prev) return bestQuad;
                    const same = prev.every((p, i) => p.x === bestQuad[i].x && p.y === bestQuad[i].y);
                    return same ? prev : bestQuad;
                });
            }

            return documentFound;
        } catch (error) {
            console.error('Document detection error:', error);
            return false;
        }
    };

    const startDocumentDetection = () => {
        stopDocumentDetection();
        
        let consecutiveDetections = 0;
        const requiredDetections = 3; // Need 3 consecutive detections
        
        detectionIntervalRef.current = setInterval(() => {
            const detected = detectDocument();
            
            if (detected) {
                consecutiveDetections++;
                if (consecutiveDetections >= requiredDetections) {
                    if (!documentDetected) {
                        setDocumentDetected(true);
                    }
                    if (autoCapture && !detectionCountdown && !countdownIntervalRef.current) {
                        startCountdown();
                    }
                }
            } else {
                consecutiveDetections = 0;
                detectedQuadRef.current = null;
                setDetectedQuad(null);
                if (documentDetected) {
                    setDocumentDetected(false);
                    setDetectionCountdown(null);
                    if (countdownIntervalRef.current) {
                        clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                    }
                }
            }
        }, 200); // Check every 200ms
    };

    const startCountdown = () => {
        setDetectionCountdown(3);
        let count = 3;
        
        countdownIntervalRef.current = setInterval(() => {
            count--;
            if (count > 0) {
                setDetectionCountdown(count);
            } else {
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                setDetectionCountdown(null);
                // Auto-capture
                if (currentDocType && documentDetected) {
                    captureSnapshot(currentDocType);
                }
            }
        }, 1000);
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
            const width = captureVideoRef.current.videoWidth;
            const height = captureVideoRef.current.videoHeight;
            if (width && height) {
                setVideoDims({ width, height });
            }
            setCaptureReady(true);
            // Start document detection after camera is ready
            setTimeout(() => startDocumentDetection(), 1000);
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
                const width = captureVideoRef.current.videoWidth;
                const height = captureVideoRef.current.videoHeight;
                if (width && height) {
                    setVideoDims({ width, height });
                }
                setCaptureReady(true);
                // Restart document detection
                setTimeout(() => startDocumentDetection(), 1000);
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
    const hasLegalCaptured = legalPage1 !== null && legalPage2 !== null;
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
    const currentDocCaptured = currentDocType 
        ? (currentDocType === 'LEGAL_AGREEMENT' 
            ? (currentLegalPage === 1 ? legalPage1 !== null : legalPage2 !== null)
            : capturedImages[currentDocType] !== null)
        : false;
    const currentDocFaceRequired = currentDocType ? FACE_REQUIRED_DOCS.has(currentDocType) : false;
    const faceBlocked = currentDocFaceRequired && !faceVerificationId;

    const allDocumentsCaptured = hasLegalCaptured && hasFrontCaptured && hasBackCaptured;

    const captureDocumentFromQuad = async (quad: Array<{ x: number; y: number }>) => {
        if (!captureVideoRef.current || !opencvLoaded || !cvRef.current) return null;
        const video = captureVideoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) return null;

        const cv = cvRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, width, height);

        const src = cv.imread(canvas);

        const [tl, tr, br, bl] = quad;
        const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
            Math.hypot(p2.x - p1.x, p2.y - p1.y);

        const targetWidth = Math.max(dist(tl, tr), dist(bl, br));
        const targetHeight = Math.max(dist(tl, bl), dist(tr, br));

        const outWidth = Math.max(1, Math.min(Math.round(targetWidth), width));
        const outHeight = Math.max(1, Math.min(Math.round(targetHeight), height));

        const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl.x, tl.y,
            tr.x, tr.y,
            br.x, br.y,
            bl.x, bl.y,
        ]);
        const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            outWidth - 1, 0,
            outWidth - 1, outHeight - 1,
            0, outHeight - 1,
        ]);

        const M = cv.getPerspectiveTransform(srcTri, dstTri);
        const dst = new cv.Mat();
        cv.warpPerspective(src, dst, M, new cv.Size(outWidth, outHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        const outCanvas = document.createElement("canvas");
        cv.imshow(outCanvas, dst);
        const dataUrl = outCanvas.toDataURL("image/jpeg", 0.85);
        const blob = await (await fetch(dataUrl)).blob();

        src.delete();
        srcTri.delete();
        dstTri.delete();
        M.delete();
        dst.delete();

        return { dataUrl, blob };
    };

    const captureSnapshot = async (docType: string) => {
        if (!captureVideoRef.current) return;
        const video = captureVideoRef.current;
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) return;

        let captured = null;
        if (detectedQuadRef.current) {
            captured = await captureDocumentFromQuad(detectedQuadRef.current);
        }

        if (!captured) {
            // Fallback to center crop if detection isn't available
            const targetRatio = 9 / 16;
            const currentRatio = width / height;

            let cropWidth, cropHeight, cropX, cropY;

            if (currentRatio > targetRatio) {
                cropHeight = Math.round(height * 0.85);
                cropWidth = Math.round(cropHeight * targetRatio);
                cropX = Math.round((width - cropWidth) / 2);
                cropY = Math.round((height - cropHeight) / 2);
            } else {
                cropWidth = Math.round(width * 0.75);
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
            captured = { dataUrl, blob };
        }

        // For legal agreement, handle 2 pages
        if (docType === 'LEGAL_AGREEMENT') {
            if (currentLegalPage === 1) {
                setLegalPage1({ dataUrl: captured.dataUrl, blob: captured.blob });
            } else {
                setLegalPage2({ dataUrl: captured.dataUrl, blob: captured.blob });
            }
        } else {
            // For ID documents, save normally
            setCapturedImages((prev) => ({ ...prev, [docType]: { dataUrl: captured.dataUrl, blob: captured.blob } }));
            setPreviews((prev) => ({ ...prev, [docType]: captured.dataUrl }));
        }
        stopDocumentDetection();
        stopCaptureCamera();
    };

    const confirmCapture = (docType: string) => {
        if (docType === 'LEGAL_AGREEMENT') {
            if (currentLegalPage === 1 && legalPage1) {
                // Move to page 2
                setCurrentLegalPage(2);
                setCaptureOpen(false);
            } else if (currentLegalPage === 2 && legalPage2) {
                // Both pages captured, mark as complete
                setCapturedImages((prev) => ({ ...prev, LEGAL_AGREEMENT: { dataUrl: legalPage1!.dataUrl, blob: legalPage1!.blob } }));
                setCaptureOpen(false);
            }
        } else {
            setCaptureOpen(false);
            // Image is already saved in capturedImages
        }
    };

    const retakeCapture = (docType: string) => {
        if (docType === 'LEGAL_AGREEMENT') {
            if (currentLegalPage === 1) {
                setLegalPage1(null);
            } else {
                setLegalPage2(null);
            }
        } else {
            setCapturedImages((prev) => ({ ...prev, [docType]: null }));
            setPreviews((prev) => ({ ...prev, [docType]: null }));
        }
        setCaptureOpen(false);
    };

    async function handleFinalSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            // Check if we have both legal pages
            if (!legalPage1 || !legalPage2) {
                setMessage('Please capture both pages of the legal agreement');
                setSubmitting(false);
                return;
            }

            // Upload all captured documents
            const docTypes = ['LEGAL_AGREEMENT', 'ID_FRONT', 'ID_BACK'];

            for (const docType of docTypes) {
                const formData = new FormData();

                if (docType === 'LEGAL_AGREEMENT') {
                    // Import jsPDF dynamically
                    const { jsPDF } = await import('jspdf');
                    
                    // Create PDF with 2 pages
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'px',
                        format: 'a4'
                    });

                    // Add first page
                    const img1 = document.createElement('img');
                    img1.src = legalPage1.dataUrl;
                    await new Promise((resolve) => { img1.onload = resolve; });
                    
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    pdf.addImage(img1, 'JPEG', 0, 0, pageWidth, pageHeight);

                    // Add second page
                    pdf.addPage();
                    const img2 = document.createElement('img');
                    img2.src = legalPage2.dataUrl;
                    await new Promise((resolve) => { img2.onload = resolve; });
                    pdf.addImage(img2, 'JPEG', 0, 0, pageWidth, pageHeight);

                    // Convert PDF to blob
                    const pdfBlob = pdf.output('blob');
                    formData.append("document", pdfBlob, `LEGAL_AGREEMENT.pdf`);
                } else {
                    // For ID documents, use the captured image
                    const captured = capturedImages[docType];
                    if (!captured) {
                        setMessage(`Please capture ${docMeta[docType].label}`);
                        setSubmitting(false);
                        return;
                    }
                    formData.append("document", captured.blob, `${docType}.jpg`);
                }

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
                                    <Card className={captureOpen ? "bg-transparent border-transparent shadow-none" : "bg-black/30 border border-gray-800"}>
                                        <CardHeader className={captureOpen ? "px-0 pb-3" : undefined}>
                                            <CardTitle>
                                                {`Step ${currentStep}: ${docMeta[currentDocType].label}`}
                                                {currentDocType === 'LEGAL_AGREEMENT' && (
                                                    <span className="text-sm text-gray-400 ml-2">
                                                        (Page {currentLegalPage} of 2)
                                                    </span>
                                                )}
                                            </CardTitle>
                                            <p className="text-sm text-gray-400">{docMeta[currentDocType].description}</p>
                                        </CardHeader>
                                        <CardContent className={captureOpen ? "space-y-4 px-0" : "space-y-4"}>
                                            {currentDocType === 'LEGAL_AGREEMENT' && (
                                                <div className={captureOpen ? "rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3" : "rounded-xl border border-emerald-700/50 bg-emerald-900/30 p-4"}>
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

                                            <div className={captureOpen ? "rounded-xl border border-gray-800/60 bg-black/10 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : "rounded-xl border border-gray-800/80 bg-black/20 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"}>
                                                <div className="flex items-center gap-4">
                                                    {!captureOpen && (
                                                        <>
                                                            {currentDocType === 'LEGAL_AGREEMENT' ? (
                                                                <div className="flex gap-2">
                                                                    <div className="w-20 h-16 rounded-lg bg-gray-800/80 flex items-center justify-center overflow-hidden relative">
                                                                        {legalPage1 ? (
                                                                            <Image src={legalPage1.dataUrl} alt="page 1" layout="fill" objectFit="cover" />
                                                                        ) : (
                                                                            <div className="text-[11px] text-gray-400 text-center px-2">Page 1</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="w-20 h-16 rounded-lg bg-gray-800/80 flex items-center justify-center overflow-hidden relative">
                                                                        {legalPage2 ? (
                                                                            <Image src={legalPage2.dataUrl} alt="page 2" layout="fill" objectFit="cover" />
                                                                        ) : (
                                                                            <div className="text-[11px] text-gray-400 text-center px-2">Page 2</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-20 h-16 rounded-lg bg-gray-800/80 flex items-center justify-center overflow-hidden relative">
                                                                    {previews[currentDocType] ? (
                                                                        <Image src={previews[currentDocType] as string} alt="preview" layout="fill" objectFit="cover" />
                                                                    ) : (
                                                                        <div className="text-[11px] text-gray-400 text-center px-2">No snapshot</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-200">{docMeta[currentDocType].label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {currentDocType === 'LEGAL_AGREEMENT' 
                                                                ? (legalPage1 && legalPage2 ? "Both pages captured" : `Capturing page ${currentLegalPage}`)
                                                                : (currentDocCaptured ? "Captured - ready to submit" : "Ready to scan")
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant={captureOpen ? "outline" : "default"}
                                                    className={captureOpen ? "w-full border-gray-700 text-gray-200 hover:bg-white/5 sm:w-auto" : "w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white"}
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
                                                <div className="rounded-xl border border-gray-800/40 bg-black/10 p-2 sm:p-4 space-y-3 sm:space-y-4 sm:rounded-2xl">
                                                    <div className="relative w-full sm:max-w-3xl mx-auto" style={{ aspectRatio: '9/16' }}>
                                                        <div className="overflow-hidden rounded-2xl border border-gray-800/40 bg-black h-full relative">
                                                            <video
                                                                ref={captureVideoRef}
                                                                className="absolute inset-0 h-full w-full object-cover"
                                                                autoPlay
                                                                muted
                                                                playsInline
                                                            />
                                                            {captureReady && detectedQuad && videoDims && (
                                                                <svg
                                                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                                                    viewBox={`0 0 ${videoDims.width} ${videoDims.height}`}
                                                                    preserveAspectRatio="xMidYMid slice"
                                                                >
                                                                    <polygon
                                                                        points={detectedQuad.map((p) => `${p.x},${p.y}`).join(" ")}
                                                                        fill="rgba(16, 185, 129, 0.12)"
                                                                        stroke="rgba(16, 185, 129, 0.85)"
                                                                        strokeWidth="4"
                                                                    />
                                                                </svg>
                                                            )}
                                                            {captureReady && (
                                                                <>
                                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                                        <div className={`absolute inset-[6%] rounded-2xl border-2 transition-all ${
                                                                            documentDetected 
                                                                                ? 'border-solid border-emerald-400 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.5)]' 
                                                                                : 'border-dashed border-emerald-400/60 bg-emerald-500/5'
                                                                        }`} />
                                                                    </div>
                                                                    {documentDetected && detectionCountdown && (
                                                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                                            <div className="text-8xl font-bold text-emerald-400 animate-pulse drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]">
                                                                                {detectionCountdown}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[11px] text-emerald-200">
                                                                        {documentDetected 
                                                                            ? 'Document detected. Hold steady...' 
                                                                            : 'Align the document inside the box'
                                                                        }
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
                                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                                                                <div className="px-3 py-2 rounded-lg bg-black/60 border border-gray-700/50 text-xs text-gray-200">
                                                                    {currentDocType === 'LEGAL_AGREEMENT' ? `Agreement Page ${currentLegalPage} of 2` : docMeta[currentDocType].label}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {autoCapture && documentDetected && detectionCountdown && (
                                                                        <div className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-sm font-semibold">
                                                                            {detectionCountdown}
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                                                                            autoCapture ? 'bg-emerald-600/80 border-emerald-500/60 text-white' : 'bg-black/60 border-gray-700/50 text-gray-200'
                                                                        }`}
                                                                        onClick={() => {
                                                                            setAutoCapture((prev) => !prev);
                                                                            if (!captureReady) return;
                                                                            if (!detectionIntervalRef.current) {
                                                                                setTimeout(() => startDocumentDetection(), 500);
                                                                            }
                                                                        }}
                                                                    >
                                                                        Auto-capture: {autoCapture ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>
                                                            </div>
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
                                                            className="w-full bg-emerald-600 text-white hover:bg-emerald-500 text-sm sm:text-base py-3 sm:py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!captureReady || (autoCapture && documentDetected && detectionCountdown !== null)}
                                                            onClick={() => {
                                                                captureSnapshot(currentDocType);
                                                            }}
                                                        >
                                                            {autoCapture ? 'Manual Capture' : 'Take Snapshot'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {currentDocCaptured && (
                                                <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-3 sm:p-4 space-y-3 sm:space-y-4">
                                                    <div className="space-y-1 sm:space-y-2">
                                                        <h4 className="text-sm sm:text-base font-semibold text-emerald-200">
                                                            Preview captured image
                                                            {currentDocType === 'LEGAL_AGREEMENT' && ` - Page ${currentLegalPage}`}
                                                        </h4>
                                                        <p className="text-xs text-emerald-200/80">Review your scan before continuing</p>
                                                    </div>

                                                    <div className="relative w-full sm:max-w-md mx-auto rounded-lg overflow-hidden border-2 border-emerald-500/30" style={{ aspectRatio: '9/16' }}>
                                                        <Image
                                                            src={
                                                                currentDocType === 'LEGAL_AGREEMENT'
                                                                    ? (currentLegalPage === 1 ? legalPage1?.dataUrl : legalPage2?.dataUrl) || ''
                                                                    : (previews[currentDocType] as string)
                                                            }
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
                                                        {currentDocType === 'LEGAL_AGREEMENT' && currentLegalPage === 1 && legalPage1 && (
                                                            <Button
                                                                type="button"
                                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 font-semibold"
                                                                onClick={() => confirmCapture(currentDocType)}
                                                            >
                                                                Continue to Page 2
                                                            </Button>
                                                        )}
                                                        {currentDocType === 'LEGAL_AGREEMENT' && currentLegalPage === 2 && legalPage2 && (
                                                            <Button
                                                                type="button"
                                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 font-semibold"
                                                                onClick={() => confirmCapture(currentDocType)}
                                                            >
                                                                Confirm Both Pages
                                                            </Button>
                                                        )}
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

                </div>
            )}
        </div>
    );
}
