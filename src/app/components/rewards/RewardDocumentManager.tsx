"use client";

import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, UploadCloud, Check, AlertTriangle, User } from 'lucide-react';
import Image from 'next/image';
import { Reward } from '@/types';
import { uploadRewardDocument, submitRewardDocuments } from '@/actions/user';

interface RewardDocumentManagerProps {
  reward: Reward;
  onRewardUpdate: (updatedReward: Reward) => void;
  onClose: () => void;
}

export const RewardDocumentManager = ({ reward, onRewardUpdate, onClose }: RewardDocumentManagerProps) => {
  const numberOfTickets = reward.rewardSnapshot.numberOfTickets ?? 1;
  const requiredDocs = reward.requiredDocuments || [];

  const [activeTicketHolder, setActiveTicketHolder] = useState(1);

  const initialFiles = Array(numberOfTickets).fill(null).map(() => Array(requiredDocs.length).fill(null));
  const [files, setFiles] = useState<(File | null)[][]>(initialFiles);

  const initialPreviews = Array(numberOfTickets).fill(null).map(() => Array(requiredDocs.length).fill(null));
  const [previews, setPreviews] = useState<(string | null)[][]>(initialPreviews);

  const [uploading, setUploading] = useState<{ ticket: number; docIndex: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (ticket: number, docIndex: number, f?: FileList | null) => {
    const newFiles = files.map(arr => [...arr]);
    const newPreviews = previews.map(arr => [...arr]);
    const file = f?.[0] ?? null;
    newFiles[ticket - 1][docIndex] = file;

    if (newPreviews[ticket - 1][docIndex]) {
      URL.revokeObjectURL(newPreviews[ticket - 1][docIndex] as string);
    }

    if (file) {
      if (file.type.startsWith('image/')) {
        newPreviews[ticket - 1][docIndex] = URL.createObjectURL(file);
      } else {
        newPreviews[ticket - 1][docIndex] = null;
      }
    } else {
      newPreviews[ticket - 1][docIndex] = null;
    }
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async (ticket: number, docIndex: number) => {
    const file = files[ticket - 1][docIndex];
    const docInfo = requiredDocs[docIndex];
    if (!file || !docInfo) return;
    const docType = docInfo.docType;

    setUploading({ ticket, docIndex });
    setMessage(null);
    setError(null);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);

    try {
      const result = await uploadRewardDocument(reward._id, formData, ticket);
      if (result.error) {
        setError(`Upload failed: ${result.error}`);
      } else {
        setMessage(result.message);
        onRewardUpdate(result.reward);

        const newFiles = files.map(arr => [...arr]);
        const newPreviews = previews.map(arr => [...arr]);
        if (newPreviews[ticket - 1][docIndex]) {
          URL.revokeObjectURL(newPreviews[ticket - 1][docIndex] as string);
        }
        newFiles[ticket - 1][docIndex] = null;
        newPreviews[ticket - 1][docIndex] = null;
        setFiles(newFiles);
        setPreviews(newPreviews);
      }
    } catch {
      setError('An unexpected error occurred during upload.');
    } finally {
      setUploading(null);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const result = await submitRewardDocuments(reward._id);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(result.message);
        onRewardUpdate(result.reward);
        onClose();
      }
    } catch {
      setError('An unexpected error occurred during submission.');
    }
    finally {
      setSubmitting(false);
    }
  };

  const isDocUploaded = (docType: string, ticket: number) => {
    return reward.uploadedDocuments?.some(d => d.docType === docType && d.ticketHolderNumber === ticket);
  };

  const canSubmitForReview = useMemo(() => {
    if (numberOfTickets === 1) {
      return reward.uploadedDocuments?.some(d => d.docType === 'PASSPORT_FRONT');
    }
    for (let i = 1; i <= numberOfTickets; i++) {
      if (!isDocUploaded('PASSPORT_FRONT', i)) {
        return false;
      }
    }
    return true;
  }, [reward.uploadedDocuments, numberOfTickets]);


  const renderTicketHolderDocs = (ticket: number) => {
    return (
      <div className="grid gap-4 mt-4">
        {requiredDocs.map((docInfo, i) => {
          const docType = docInfo.docType;
          const isUploaded = isDocUploaded(docType, ticket);
          const isUploading = uploading?.ticket === ticket && uploading?.docIndex === i;
          const fileStaged = files[ticket - 1][i];
          const previewUrl = previews[ticket - 1][i];

          return (
            <div key={`${ticket}-${i}`} className="flex items-center gap-4 p-2 rounded-md bg-gray-800/50">
              <div className="w-16 h-16 rounded-md bg-gray-700 flex items-center justify-center overflow-hidden relative">
                {previewUrl ? (
                  <Image src={previewUrl} alt="preview" layout="fill" objectFit="cover" />
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
                  <div className="text-sm text-gray-200">{docInfo.description}</div>
                  <div className="flex items-center gap-2">
                    {fileStaged ? (
                      <>
                        <div className="text-xs text-gray-300 max-w-[120px] truncate">{fileStaged.name}</div>
                        <button
                          type="button"
                          onClick={() => handleUpload(ticket, i)}
                          disabled={isUploading}
                          className="px-2 py-1 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" /> {isUploading ? '...' : 'Upload'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFileChange(ticket, i, null)}
                          className="px-2 py-1 rounded-md bg-red-600/20 text-xs text-red-300 hover:bg-red-600/30"
                        >
                          Clear
                        </button>
                      </>
                    ) : (
                      <>
                        {isUploaded && <div className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3"/> Uploaded</div>}
                        <label className="cursor-pointer px-2 py-1 rounded-md bg-white/5 text-xs text-white/90 hover:bg-white/10">
                          {isUploaded ? 'Re-upload' : 'Select File'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange(ticket, i, e.target.files)}
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
    );
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 mt-4">
      <h4 className="font-bold text-lg text-emerald-300 mb-1">Action Required: Upload Documents</h4>
      <p className="text-sm text-gray-400 mb-4">
        Your claim has been approved. Please upload the following documents to proceed.
      </p>

      {reward.rejectionReason && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h5 className="font-semibold">Submission Rejected</h5>
          </div>
          <p className="text-sm mt-1">Reason: {reward.rejectionReason}</p>
          <p className="text-xs mt-2">Please correct the issues by re-uploading the documents and resubmitting.</p>
        </div>
      )}

      {numberOfTickets > 1 && (
        <div className="border-b border-gray-700 mb-4">
          <nav className="-mb-px flex gap-4" aria-label="Tabs">
            {Array.from({ length: numberOfTickets }, (_, i) => i + 1).map(ticketNum => (
              <button
                key={ticketNum}
                onClick={() => setActiveTicketHolder(ticketNum)}
                className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTicketHolder === ticketNum
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`
                }
              >
                <User className="w-4 h-4" />
                Ticket Holder #{ticketNum}
              </button>
            ))}
          </nav>
        </div>
      )}

      {renderTicketHolderDocs(activeTicketHolder)}

      <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={!canSubmitForReview || submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
        <div className="text-xs text-gray-400 text-right">
          {canSubmitForReview
            ? "Ready for final submission."
            : "Passport (Front) must be uploaded for all ticket holders to submit."}
        </div>
      </div>

      {message && <div className="text-sm mt-3 text-center text-green-300">{message}</div>}
      {error && <div className="text-sm mt-3 text-center text-red-300">{error}</div>}
    </div>
  );
};