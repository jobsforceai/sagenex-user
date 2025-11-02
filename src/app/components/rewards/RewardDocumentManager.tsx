"use client";

import React, { useState } from 'react';
import { FileText, CheckCircle, UploadCloud, Check, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Reward } from '@/types';
import { uploadRewardDocument, submitRewardDocuments } from '@/actions/user';

interface RewardDocumentManagerProps {
  reward: Reward;
  onRewardUpdate: (updatedReward: Reward) => void; // Callback to update the reward state
  onClose: () => void; // Callback to close the modal
}

// Based on backend docs
const docSlotsConfig = {
    PASSPORT: { label: 'Passport', accept: 'image/*,.pdf' },
    VISA: { label: 'Visa', accept: 'image/*,.pdf' },
    FLIGHT_PREFERENCE: { label: 'Flight Preference', accept: 'image/*,.pdf' },
    OTHER: { label: 'Other Document', accept: 'image/*,.pdf' },
};

export const RewardDocumentManager = ({ reward, onRewardUpdate, onClose }: RewardDocumentManagerProps) => {
  const requiredDocs = reward.requiredDocuments || [];
  const [files, setFiles] = useState<(File | null)[]>(Array(requiredDocs.length).fill(null));
  const [previews, setPreviews] = useState<(string | null)[]>(Array(requiredDocs.length).fill(null));
  const [uploading, setUploading] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (index: number, f?: FileList | null) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    const file = f?.[0] ?? null;
    newFiles[index] = file;

    if (previews[index]) {
      URL.revokeObjectURL(previews[index] as string);
    }

    if (file) {
      if (file.type.startsWith('image/')) {
        newPreviews[index] = URL.createObjectURL(file);
      } else {
        newPreviews[index] = null;
      }
    } else {
      newPreviews[index] = null;
    }
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async (index: number) => {
    const file = files[index];
    const docInfo = requiredDocs[index];
    if (!file || !docInfo) return;
    const docType = docInfo.docType;

    setUploading(index);
    setMessage(null);
    setError(null);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('docType', docType);

    try {
      const result = await uploadRewardDocument(reward._id, formData);
      if (result.error) {
        setError(`Upload failed: ${result.error}`);
      } else {
        setMessage(result.message);
        onRewardUpdate(result.reward); // Pass the updated reward object back

        // Clear the local file state for the uploaded slot
        const newFiles = [...files];
        const newPreviews = [...previews];
        if (newPreviews[index]) {
          URL.revokeObjectURL(newPreviews[index] as string);
        }
        newFiles[index] = null;
        newPreviews[index] = null;
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
        onClose(); // Close the modal on successful submission
      }
    } catch {
      setError('An unexpected error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDocUploaded = (docType: string) => {
    return reward.uploadedDocuments?.some(d => d.docType === docType);
  };

  const canSubmitForReview = reward.uploadedDocuments?.some(d => d.docType === 'PASSPORT');

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

      <div className="grid gap-4">
        {requiredDocs.map((docInfo, i) => {
          const docType = docInfo.docType;
          const slot = docSlotsConfig[docType as keyof typeof docSlotsConfig] || { label: docInfo.description, accept: '*' };
          const isUploaded = isDocUploaded(docType);
          const isUploading = uploading === i;
          const fileStaged = files[i];

          return (
            <div key={i} className="flex items-center gap-4 p-2 rounded-md bg-gray-800/50">
              <div className="w-16 h-16 rounded-md bg-gray-700 flex items-center justify-center overflow-hidden relative">
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
                        <div className="text-xs text-gray-300 max-w-[120px] truncate">{fileStaged.name}</div>
                        <button
                          type="button"
                          onClick={() => handleUpload(i)}
                          disabled={isUploading}
                          className="px-2 py-1 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" /> {isUploading ? '...' : 'Upload'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFileChange(i, null)}
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
          {canSubmitForReview ? "Ready for final submission." : "Passport must be uploaded to submit."}
        </div>
      </div>

      {message && <div className="text-sm mt-3 text-center text-green-300">{message}</div>}
      {error && <div className="text-sm mt-3 text-center text-red-300">{error}</div>}
    </div>
  );
};