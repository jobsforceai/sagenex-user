"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, UploadCloud, Check } from 'lucide-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';
import FaceVerificationPanel from '@/app/components/biometrics/FaceVerificationPanel';
import { Button } from '@/components/ui/button';

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
    { label: 'Signed Legal Agreement', docType: 'LEGAL_AGREEMENT', accept: 'image/*,.pdf', mode: 'file' },
    { label: 'ID Front', docType: 'ID_FRONT', accept: 'image/*', mode: 'camera' },
    { label: 'ID Back', docType: 'ID_BACK', accept: 'image/*', mode: 'camera' },
];

const FACE_REQUIRED_DOCS = new Set(['ID_FRONT', 'ID_BACK']);

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<Record<string, File | null>>({
    LEGAL_AGREEMENT: null,
    ID_FRONT: null,
    ID_BACK: null,
  });
  const [previews, setPreviews] = useState<Record<string, string | null>>({
    LEGAL_AGREEMENT: null,
    ID_FRONT: null,
    ID_BACK: null,
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('telugu');
  const [activeFaceDoc, setActiveFaceDoc] = useState<string | null>(null);
  const [faceVerificationMap, setFaceVerificationMap] = useState<Record<string, string>>({});
  const [faceVerifiedDoc, setFaceVerifiedDoc] = useState<string | null>(null);
  const [captureDocType, setCaptureDocType] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captureReady, setCaptureReady] = useState(false);
  const captureVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const captureStreamRef = React.useRef<MediaStream | null>(null);

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

  function handleFileChange(docType: string, f?: FileList | null) {
    const nextFiles = { ...files };
    const nextPreviews = { ...previews };
    nextFiles[docType] = f?.[0] ?? null;
    if (f?.[0]) {
      const file = f[0];
      if (file.type.startsWith('image/')) {
        if (nextPreviews[docType]) URL.revokeObjectURL(nextPreviews[docType] as string);
        nextPreviews[docType] = URL.createObjectURL(file);
      } else {
        if (nextPreviews[docType]) URL.revokeObjectURL(nextPreviews[docType] as string);
        nextPreviews[docType] = null;
      }
    } else {
      if (nextPreviews[docType]) URL.revokeObjectURL(nextPreviews[docType] as string);
      nextPreviews[docType] = null;
    }
    setFiles(nextFiles);
    setPreviews(nextPreviews);
  }

  async function handleUpload(docType: string) {
    const file = files[docType];
    if (!file) return;

    const faceVerificationId = faceVerificationMap[docType];
    if (FACE_REQUIRED_DOCS.has(docType) && !faceVerificationId) {
      setMessage("Please complete face verification before uploading ID documents.");
      return;
    }

    setUploading(docType);
    setMessage(null);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);
    if (FACE_REQUIRED_DOCS.has(docType) && faceVerificationId) {
        formData.append('faceVerificationId', faceVerificationId);
    }

    try {
        const result = await uploadKycDocument(formData);
        if (result.error) {
            setMessage(`Upload failed: ${result.error}`);
        } else {
            setMessage(result.message);
            setKycStatus(result.kyc); // Update status from response
            // Clear the staged file
            const nextFiles = { ...files };
            const nextPreviews = { ...previews };
            if (nextPreviews[docType]) URL.revokeObjectURL(nextPreviews[docType] as string);
            nextFiles[docType] = null;
            nextPreviews[docType] = null;
            setFiles(nextFiles);
            setPreviews(nextPreviews);
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

  const captureSnapshot = async (docType: string) => {
    if (!captureVideoRef.current) return;
    const video = captureVideoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append("document", blob, `${docType}.jpg`);
    formData.append("docType", docType);
    const faceVerificationId = faceVerificationMap[docType];
    if (faceVerificationId) {
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
        setCaptureDocType(null);
        stopCaptureCamera();
      }
    } catch {
      setMessage("An unexpected error occurred during upload.");
    } finally {
      setUploading(null);
    }
  };

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
                    Upload the legal agreement and your ID front/back. ID uploads require face verification.
                </p>
                </header>

                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 mb-6">
                    <h3 className="font-bold text-lg text-emerald-300 mb-4 text-center">How to Scan and Upload Documents</h3>
                    <div className="flex justify-center border-b border-gray-700 mb-4">
                        <button onClick={() => setActiveTab('telugu')} className={`px-4 py-2 font-semibold ${activeTab === 'telugu' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>Telugu</button>
                        <button onClick={() => setActiveTab('hindi')} className={`px-4 py-2 font-semibold ${activeTab === 'hindi' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>Hindi</button>
                        <button onClick={() => setActiveTab('english')} className={`px-4 py-2 font-semibold ${activeTab === 'english' ? 'border-b-2 border-emerald-400 text-emerald-400' : 'text-gray-400'}`}>English</button>
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
                            className="w-full h-[400px] rounded-lg"
                        ></iframe>
                    </div>
                </div>

                {kycStatus?.status === 'REJECTED' && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl mb-6 text-center">
                        <h3 className="font-bold">Submission Rejected</h3>
                        <p>Reason: {kycStatus.rejectionReason}</p>
                        <p className="mt-2 text-sm">Please correct the issues by re-uploading the documents and resubmitting.</p>
                    </div>
                )}

                <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
                    <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-5 mb-6">
                        <h3 className="font-bold text-lg text-emerald-300 mb-2">Step 1: Download and Sign the Legal Agreement</h3>
                        <p className="text-sm text-gray-300 mb-4">
                            Please download the legal agreement PDF, print it, sign it, and then scan or take a clear photo of the signed document. You will need to upload this in the next step.
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

                    <div className="grid gap-6">
                        {docSlots.map((slot) => {
                            const isUploaded = kycStatus?.documents.some(d => d.docType === slot.docType);
                            const isUploading = uploading === slot.docType;
                            const fileStaged = files[slot.docType];
                            const faceRequired = FACE_REQUIRED_DOCS.has(slot.docType);
                            const faceVerificationId = faceVerificationMap[slot.docType];
                            const faceBlocked = faceRequired && !faceVerificationId;
                            const isCaptureActive = captureDocType === slot.docType;

                            return (
                                <div key={slot.docType} className="rounded-2xl border border-gray-800/80 bg-black/20 p-5">
                                    <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                                        <div className="w-full max-w-[180px] sm:max-w-none rounded-xl bg-gray-800/80 aspect-[4/3] flex items-center justify-center overflow-hidden relative">
                                        {previews[slot.docType] ? (
                                            <Image src={previews[slot.docType] as string} alt="preview" layout="fill" objectFit="cover" />
                                        ) : fileStaged && fileStaged.type === 'application/pdf' ? (
                                            <FileText className="text-emerald-300 w-8 h-8" />
                                        ) : isUploaded ? (
                                            <CheckCircle className="text-green-400 w-8 h-8" />
                                        ) : (
                                            <div className="text-xs text-gray-400 px-2 text-center">
                                                {slot.mode === "camera" ? "No snapshot" : "No file"}
                                            </div>
                                        )}
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-200">{slot.label}</div>
                                                    {faceRequired && (
                                                        <div className="text-xs text-gray-500">Face verification required for this ID.</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                    {faceRequired && (
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                                                faceVerificationId
                                                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                                                    : "border-amber-400/40 bg-amber-500/10 text-amber-200"
                                                            }`}
                                                        >
                                                            {faceVerificationId ? "Face Verified" : "Face Required"}
                                                        </span>
                                                    )}
                                                {slot.mode === "file" && fileStaged ? (
                                                    <>
                                                        <div className="text-xs text-gray-300 max-w-[150px] truncate">{fileStaged.name}</div>
                                                        <button
                                                            onClick={() => handleUpload(slot.docType)}
                                                            disabled={isUploading || faceBlocked}
                                                            className="w-full sm:w-auto px-3 py-1 rounded-md bg-emerald-600/80 text-sm text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-1"
                                                        >
                                                            <UploadCloud className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFileChange(slot.docType, null)}
                                                            className="w-full sm:w-auto px-3 py-1 rounded-md bg-red-600/20 text-sm text-red-300 hover:bg-red-600/30"
                                                        >
                                                            Clear
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {isUploaded && <div className="text-xs text-green-400 flex items-center gap-1"><Check className="w-4 h-4"/> Uploaded</div>}
                                                        {slot.mode === "file" ? (
                                                            <label className="cursor-pointer w-full sm:w-auto px-3 py-1 rounded-md bg-white/5 text-sm text-white/90 hover:bg-white/10 text-center">
                                                                {isUploaded ? 'Re-upload' : 'Select File'}
                                                                <input
                                                                    type="file"
                                                                    accept={slot.accept}
                                                                    onChange={(e) => handleFileChange(slot.docType, e.target.files)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        ) : (
                                                            <Button
                                                              type="button"
                                                              variant="outline"
                                                              className="w-full border-gray-700 text-gray-200 hover:bg-white/5 sm:w-auto"
                                                              onClick={() => {
                                                                setCaptureError(null);
                                                                if (captureDocType && captureDocType !== slot.docType) {
                                                                  stopCaptureCamera();
                                                                }
                                                                const nextDoc = isCaptureActive ? null : slot.docType;
                                                                setCaptureDocType(nextDoc);
                                                                setActiveFaceDoc(nextDoc);
                                                                if (!nextDoc) {
                                                                  stopCaptureCamera();
                                                                }
                                                              }}
                                                            >
                                                              {isCaptureActive ? "Close Camera" : isUploaded ? "Retake ID" : "Capture ID"}
                                                            </Button>
                                                        )}
                                                        {faceBlocked && (
                                                            <span className="text-xs text-amber-300">Verify face first.</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                            {slot.mode === "camera" && isCaptureActive && (
                                              <div className="rounded-xl border border-gray-800/80 bg-black/30 p-4 space-y-4">
                                                {faceRequired && (
                                                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                                    {faceVerificationId ? (
                                                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                                        Face verified. You can capture this ID now.
                                                      </div>
                                                    ) : (
                                                      <FaceVerificationPanel
                                                        purpose="KYC"
                                                        enrollHref="/face-test?mode=enroll&next=/kyc"
                                                        onVerified={(passed) =>
                                                          setFaceVerifiedDoc(passed ? slot.docType : null)
                                                        }
                                                        onVerificationToken={(token) =>
                                                          setFaceVerificationMap((prev) => ({
                                                            ...prev,
                                                            [slot.docType]: token?.verificationId ?? "",
                                                          }))
                                                        }
                                                      />
                                                    )}
                                                  </div>
                                                )}
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-800 bg-black">
                                                  <video
                                                    ref={captureVideoRef}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                  />
                                                </div>
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
                                                    disabled={!captureReady || isUploading || faceBlocked}
                                                    onClick={() => captureSnapshot(slot.docType)}
                                                  >
                                                    {isUploading ? "Uploading..." : "Take Snapshot"}
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={!canSubmitForReview || submitting}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit for Review'}
                        </button>
                        <div className="text-sm text-gray-400">
                            {canSubmitForReview ? "All required documents are uploaded." : "Please upload all required documents."}
                        </div>
                    </div>

                    {message && <div className="text-sm mt-4 text-center text-emerald-300">{message}</div>}
                </div>
            </div>
        )}
    </div>
  );
}
