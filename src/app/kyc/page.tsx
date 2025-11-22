"use client"

import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, AlertTriangle, UploadCloud, Check } from 'lucide-react';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import { getKycStatus, uploadKycDocument, submitKycForReview } from '@/actions/user';
import { KycStatus } from '@/types';

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
                    Upload your documents one by one. Once all required documents are uploaded, submit them for review.
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
                        {docSlots.map((slot, i) => {
                            const isUploaded = kycStatus?.documents.some(d => d.docType === slot.docType);
                            const isUploading = uploading === i;
                            const fileStaged = files[i];

                            return (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-md bg-gray-800 flex items-center justify-center overflow-hidden relative">
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

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-200">{slot.label}</div>
                                            <div className="flex items-center gap-2">
                                                {fileStaged ? (
                                                    <>
                                                        <div className="text-xs text-gray-300 max-w-[150px] truncate">{fileStaged.name}</div>
                                                        <button
                                                            onClick={() => handleUpload(i)}
                                                            disabled={isUploading}
                                                            className="px-3 py-1 rounded-md bg-emerald-600/80 text-sm text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <UploadCloud className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleFileChange(i, null)}
                                                            className="px-3 py-1 rounded-md bg-red-600/20 text-sm text-red-300 hover:bg-red-600/30"
                                                        >
                                                            Clear
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        {isUploaded && <div className="text-xs text-green-400 flex items-center gap-1"><Check className="w-4 h-4"/> Uploaded</div>}
                                                        <label className="cursor-pointer px-3 py-1 rounded-md bg-white/5 text-sm text-white/90 hover:bg-white/10">
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
