"use client"

import React, { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Image from 'next/image';

export default function KycPage() {
  const [files, setFiles] = useState<(File | null)[]>([null, null, null, null]);
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([0, 0, 0, 0]);
  const [uploaded, setUploaded] = useState<boolean[]>([false, false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const intervals = useRef<(number | null)[]>([null, null, null, null]);

  function handleFileChange(index: number, f?: FileList | null) {
    const newFiles = [...files];
    const newPreviews = [...previews];
    const newUploaded = [...uploaded];
    newFiles[index] = f && f[0] ? f[0] : null;
    if (f && f[0]) {
      const file = f[0];
      // only create image previews for image types
      if (file.type.startsWith('image/')) {
        // revoke previous preview if present
        if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
        const url = URL.createObjectURL(file);
        newPreviews[index] = url;
      } else {
        // non-image (pdf etc) - don't set an image preview
        if (newPreviews[index]) {
          URL.revokeObjectURL(newPreviews[index] as string);
        }
        newPreviews[index] = null;
      }
      newUploaded[index] = false;
    } else {
      // remove preview if file cleared
      if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
      newPreviews[index] = null;
      newUploaded[index] = false;
    }
    setFiles(newFiles);
    setPreviews(newPreviews);
    setUploaded(newUploaded);
    // reset progress for that slot
    setUploadProgress((p) => {
      const copy = [...p];
      copy[index] = 0;
      return copy;
    });
  }

  function removeFile(index: number) {
    const newFiles = [...files];
    const newPreviews = [...previews];
    const newUploaded = [...uploaded];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index] as string);
    newFiles[index] = null;
    newPreviews[index] = null;
    newUploaded[index] = false;
    setFiles(newFiles);
    setPreviews(newPreviews);
    setUploaded(newUploaded);
    setUploadProgress((p) => {
      const copy = [...p];
      copy[index] = 0;
      return copy;
    });
    // clear any running interval
    if (intervals.current[index]) {
      window.clearInterval(intervals.current[index] as number);
      intervals.current[index] = null;
    }
  }

  const canSubmit = files.some((f) => f !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return setMessage('Please attach at least one document.');
    setSubmitting(true);
    setMessage(null);
    try {
      // Simulate per-file upload with progress
      const indices = files.map((f, i) => (f ? i : -1)).filter((i) => i !== -1) as number[];
      await Promise.all(
        indices.map(
          (i) =>
            new Promise<void>((res) => {
              let progress = 0;
              // randomize speed
              const speed = 30 + Math.random() * 70; // ms per tick
              intervals.current[i] = window.setInterval(() => {
                progress += Math.floor(6 + Math.random() * 12);
                if (progress >= 100) progress = 100;
                setUploadProgress((p) => {
                  const copy = [...p];
                  copy[i] = progress;
                  return copy;
                });
                if (progress >= 100) {
                  if (intervals.current[i]) {
                    window.clearInterval(intervals.current[i] as number);
                    intervals.current[i] = null;
                  }
                  setUploaded((u) => {
                    const copy = [...u];
                    copy[i] = true;
                    return copy;
                  });
                  // small delay so users see 100%
                  setTimeout(() => res(), 200);
                }
              }, speed);
            })
        )
      );

      setMessage('Documents uploaded successfully. Our team will review within 48 hours.');
      // keep previews but reset file inputs so user can re-upload if needed
      setFiles([null, null, null, null]);
    } catch (err) {
      setMessage('Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // cleanup object URLs & intervals on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => p && URL.revokeObjectURL(p));
      intervals.current.forEach((id) => id && window.clearInterval(id));
    };
  }, [previews]);

  return (
    <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
      <div className="max-w-4xl mt-16 mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            KYC — Verify your identity
          </h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            To access Sagenex features and ensure platform security, please upload the requested identity and proof-of-address documents. We use secure, privacy-preserving verification powered by our KYC engine.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8">
          <div className="grid gap-6">
            {[
              { label: 'Government ID (passport, driver\'s license)', accept: 'image/*,.pdf' },
              { label: 'Proof of Address (utility bill, bank statement)', accept: 'image/*,.pdf' },
              { label: 'Selfie / Liveness Photo', accept: 'image/*' },
              { label: 'Additional Document (optional)', accept: 'image/*,.pdf' },
            ].map((slot, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-md bg-gray-800 flex items-center justify-center overflow-hidden">
                  {previews[i] ? (
                    // show image preview when possible
                    <Image height={500} width={500} src={previews[i] as string} alt={`preview-${i}`} className="w-full h-full object-cover" />
                  ) : files[i] && files[i]!.type === 'application/pdf' ? (
                    // show PDF icon
                    <div className="flex items-center justify-center w-full h-full">
                      <FileText className="text-emerald-300 w-8 h-8" />
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 px-2 text-center">No file</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-200">{slot.label}</div>
                    <div className="flex items-center gap-2">
                      {files[i] && (
                        <div className="text-xs text-gray-300 max-w-[200px] truncate">{files[i]!.name}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => inputRefs.current[i]?.click()}
                        className="px-3 py-1 rounded-md bg-white/5 text-sm text-white/90 hover:bg-white/10"
                      >
                        {files[i] ? 'Change' : 'Upload'}
                      </button>
                      {files[i] && (
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="px-3 py-1 rounded-md bg-red-600/20 text-sm text-red-300 hover:bg-red-600/30"
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={(el) => { inputRefs.current[i] = el; return; }}
                        type="file"
                        accept={slot.accept}
                        onChange={(e) => handleFileChange(i, e.target.files)}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* progress / uploaded state */}
                  <div className="mt-2">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-emerald-500 transition-all`} 
                        style={{ width: `${uploadProgress[i]}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {uploaded[i] ? 'Uploaded' : uploadProgress[i] > 0 ? `${uploadProgress[i]}%` : 'Not uploaded'}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
              >
                {submitting ? 'Uploading...' : 'Submit Documents'}
              </button>
              <div className="text-sm text-gray-400">We will notify you by email once verification completes.</div>
            </div>

            {message && <div className="text-sm mt-2 text-emerald-300">{message}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
