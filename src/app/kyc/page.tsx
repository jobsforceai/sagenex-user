"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Fingerprint,
  Info,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { getKycStatus, submitKycForReview, uploadKycDocument } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KycStatus } from "@/types";

const CURRENT_KYC_VERSION = "SGNX_GOLD_KYC_V1_3";

type ApplicantType = "INDIVIDUAL" | "ENTITY";
type DocType =
  | "LEGAL_AGREEMENT"
  | "PAN"
  | "ID_FRONT"
  | "ID_BACK"
  | "BANK_PROOF"
  | "RECENT_ADDRESS"
  | "PHOTO_VERIFICATION"
  | "CONSTITUTIONAL_DOCS"
  | "AUTHORITY_DOC"
  | "OWNERSHIP_CHART"
  | "SOURCE_OF_FUNDS"
  | "TAX_RESIDENCY"
  | "GOLD_INVOICE_CUSTODY";

type DocumentStep = {
  docType: DocType;
  step: number;
  label: string;
  shortLabel: string;
  description: string;
  helper: string;
  required: boolean;
  audience?: string;
};

const entityTypeOptions = [
  "Private Limited / Company",
  "Partnership / LLP",
  "Trust / Society",
  "Proprietorship",
  "HUF",
  "Other entity",
];

const individualDocumentSteps: DocumentStep[] = [
  {
    docType: "LEGAL_AGREEMENT",
    step: 1,
    label: "Signed SGNX Gold KYC v1.3 Form",
    shortLabel: "KYC Form",
    description: "Download, complete, sign, and upload the SGNX Gold KYC and risk acknowledgement form.",
    helper: "Signed PDF or clear scanned image accepted.",
    required: true,
  },
  {
    docType: "PAN",
    step: 2,
    label: "PAN",
    shortLabel: "PAN",
    description: "Upload a clear PAN copy.",
    helper: "Make sure all text is readable.",
    required: true,
  },
  {
    docType: "ID_FRONT",
    step: 3,
    label: "Identity / Address Proof Front",
    shortLabel: "ID Front",
    description: "Upload the front side of your Aadhaar or other valid OVD/address proof.",
    helper: "Mask Aadhaar where required and keep all text readable.",
    required: true,
  },
  {
    docType: "ID_BACK",
    step: 4,
    label: "Identity / Address Proof Back",
    shortLabel: "ID Back",
    description: "Upload the back side of your Aadhaar or other valid OVD/address proof.",
    helper: "Avoid glare, blur, and cropped edges.",
    required: true,
  },
  {
    docType: "BANK_PROOF",
    step: 5,
    label: "Bank Proof",
    shortLabel: "Bank Proof",
    description: "Upload cancelled cheque, passbook, or bank statement proof for verified settlements.",
    helper: "Account holder name, account number, and IFSC should be visible.",
    required: true,
  },
  {
    docType: "TAX_RESIDENCY",
    step: 6,
    label: "Tax Residency Self-Certification",
    shortLabel: "Tax Residency",
    description: "Upload your signed tax residency self-certification.",
    helper: "Required for the SGNX Gold KYC v1.3 record.",
    required: true,
  },
  {
    docType: "RECENT_ADDRESS",
    step: 7,
    label: "Recent Address Evidence",
    shortLabel: "Address Evidence",
    description: "Upload recent address evidence if your OVD address needs support.",
    helper: "Optional unless the review team asks for it.",
    required: false,
  },
  {
    docType: "PHOTO_VERIFICATION",
    step: 8,
    label: "Photograph / Live Verification",
    shortLabel: "Photo",
    description: "Upload a photograph or live verification proof if applicable.",
    helper: "Optional unless requested for risk review.",
    required: false,
  },
  {
    docType: "SOURCE_OF_FUNDS",
    step: 9,
    label: "Income / Source Evidence",
    shortLabel: "Source",
    description: "Upload income or source-of-funds evidence when available.",
    helper: "Risk-based supporting document.",
    required: false,
  },
  {
    docType: "GOLD_INVOICE_CUSTODY",
    step: 10,
    label: "Gold Invoice / Custody Schedule",
    shortLabel: "Gold Schedule",
    description: "Upload gold invoice or custody schedule when applicable.",
    helper: "Product-specific supporting document.",
    required: false,
  },
];

const entityDocumentSteps: DocumentStep[] = [
  {
    docType: "LEGAL_AGREEMENT",
    step: 1,
    label: "Signed SGNX Gold KYC v1.3 Form",
    shortLabel: "KYC Form",
    description: "Download, complete, sign, and upload the SGNX Gold KYC and risk acknowledgement form.",
    helper: "Signed PDF or clear scanned image accepted.",
    required: true,
  },
  {
    docType: "PAN",
    step: 2,
    label: "Entity PAN + Signatory / UBO PAN",
    shortLabel: "PAN",
    description: "Upload PAN proof for the entity and signatory or UBO.",
    helper: "Entity and authorised person details should be readable.",
    required: true,
  },
  {
    docType: "ID_FRONT",
    step: 3,
    label: "Signatory / UBO Identity Proof Front",
    shortLabel: "ID Front",
    description: "Upload the front side of signatory or UBO identity/address proof.",
    helper: "Mask Aadhaar where required and keep all text readable.",
    required: true,
  },
  {
    docType: "ID_BACK",
    step: 4,
    label: "Signatory / UBO Identity Proof Back",
    shortLabel: "ID Back",
    description: "Upload the back side of signatory or UBO identity/address proof.",
    helper: "Avoid glare, blur, and cropped edges.",
    required: true,
  },
  {
    docType: "RECENT_ADDRESS",
    step: 5,
    label: "Registered / Principal Office Proof",
    shortLabel: "Office Proof",
    description: "Upload registered or principal office address evidence.",
    helper: "Recent utility bill, rent agreement, or registration proof accepted.",
    required: true,
  },
  {
    docType: "BANK_PROOF",
    step: 6,
    label: "Bank Proof",
    shortLabel: "Bank Proof",
    description: "Upload cancelled cheque, passbook, or bank statement proof for verified settlements.",
    helper: "Account holder name, account number, and IFSC should be visible.",
    required: true,
  },
  {
    docType: "CONSTITUTIONAL_DOCS",
    step: 7,
    label: "Constitutional Documents",
    shortLabel: "Constitution",
    description: "Upload COI, MOA/AOA, deed, partnership deed, trust deed, or equivalent document.",
    helper: "Choose the document that applies to your entity type.",
    required: true,
  },
  {
    docType: "AUTHORITY_DOC",
    step: 8,
    label: "Authority Document",
    shortLabel: "Authority",
    description: "Upload board, partner, or trust resolution authorising the transaction/account.",
    helper: "The signatory or authorised person should be clearly named.",
    required: true,
  },
  {
    docType: "OWNERSHIP_CHART",
    step: 9,
    label: "Ownership / Control Chart",
    shortLabel: "Ownership",
    description: "Upload the entity ownership or control chart.",
    helper: "Required for entity KYC.",
    required: true,
  },
  {
    docType: "TAX_RESIDENCY",
    step: 10,
    label: "Tax Residency Self-Certification",
    shortLabel: "Tax Residency",
    description: "Upload the entity tax residency self-certification.",
    helper: "Required for the SGNX Gold KYC v1.3 record.",
    required: true,
  },
  {
    docType: "PHOTO_VERIFICATION",
    step: 11,
    label: "Photograph / Live Verification",
    shortLabel: "Photo",
    description: "Upload signatory or UBO photograph/live verification proof if applicable.",
    helper: "Optional unless requested for risk review.",
    required: false,
  },
  {
    docType: "SOURCE_OF_FUNDS",
    step: 12,
    label: "Income / Source Evidence",
    shortLabel: "Source",
    description: "Upload income or source-of-funds evidence when available.",
    helper: "Risk-based supporting document.",
    required: false,
  },
  {
    docType: "GOLD_INVOICE_CUSTODY",
    step: 13,
    label: "Gold Invoice / Custody Schedule",
    shortLabel: "Gold Schedule",
    description: "Upload gold invoice or custody schedule when applicable.",
    helper: "Product-specific supporting document.",
    required: false,
  },
];

const documentStepsByApplicantType: Record<ApplicantType, DocumentStep[]> = {
  INDIVIDUAL: individualDocumentSteps,
  ENTITY: entityDocumentSteps,
};

const statusCopy: Record<
  KycStatus["status"],
  {
    title: string;
    eyebrow: string;
    description: string;
    badgeClass: string;
    iconClass: string;
  }
> = {
  NOT_SUBMITTED: {
    title: "Verify Your Identity",
    eyebrow: "KYC Not Submitted",
    description: "Upload your documents to unlock withdrawals, rewards, and secure wallet actions.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-500 bg-amber-50",
  },
  REQUIRES_REKYC: {
    title: "New KYC Required",
    eyebrow: "Re-KYC Required",
    description: "SGNX Gold KYC v1.3 is now mandatory. Upload the new signed form and required proofs to restore KYC access.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-500 bg-amber-50",
  },
  PENDING: {
    title: "KYC Submitted",
    eyebrow: "Review In Progress",
    description: "Your documents are with the review team. This usually takes up to 48 hours.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    iconClass: "text-amber-500 bg-amber-50",
  },
  VERIFIED: {
    title: "KYC Verified",
    eyebrow: "Identity Confirmed",
    description: "Your identity has been verified. You can use eligible wallet and reward features.",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconClass: "text-emerald-600 bg-emerald-50",
  },
  REJECTED: {
    title: "KYC Needs Attention",
    eyebrow: "Submission Rejected",
    description: "Please correct the issue, re-upload the required documents, and submit again.",
    badgeClass: "bg-[#FFF1F4] text-[#C8103E] border-rose-200",
    iconClass: "text-[#C8103E] bg-[#FFF1F4]",
  },
};

const isDocUploaded = (status: KycStatus | null, docType: DocType) =>
  Boolean(status?.documents.some((doc) => doc.docType === docType && doc.kycVersion === CURRENT_KYC_VERSION));

const getStatusIcon = (status: KycStatus["status"]) => {
  if (status === "VERIFIED") return CheckCircle2;
  if (status === "REJECTED") return AlertTriangle;
  if (status === "PENDING") return Clock3;
  return ShieldCheck;
};

const KycHeader = ({ status }: { status: KycStatus["status"] }) => {
  const copy = statusCopy[status];
  const StatusIcon = getStatusIcon(status);

  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] ${copy.badgeClass}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {copy.eyebrow}
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-[#0F172A] sm:text-4xl">KYC Verification</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#64748B] sm:text-base">{copy.description}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${copy.iconClass}`}>
              <StatusIcon className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-black text-[#0F172A]">{copy.title}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

const KycHeroCard = ({
  status,
  uploadedCount,
  requiredCount,
}: {
  status: KycStatus["status"];
  uploadedCount: number;
  requiredCount: number;
}) => {
  const copy = statusCopy[status];

  return (
    <section className="wallet-red-surface relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#B0002D_0%,#7A001F_58%,#30000C_100%)] p-4 text-white shadow-[0_24px_70px_rgba(122,0,31,0.22)] sm:p-6 lg:p-7">
      <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.8)_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -right-28 -bottom-28 h-80 w-80 rounded-full bg-[#F59E0B]/18 blur-3xl" />
      <Image
        src="/payouts/secure-verified-shield.png"
        alt=""
        width={240}
        height={240}
        className="pointer-events-none absolute -right-8 bottom-[-34px] hidden h-56 w-56 object-contain opacity-20 drop-shadow-2xl lg:block"
      />
      <div className="relative max-w-5xl">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-amber-100" />
            <p className="wallet-red-muted text-[11px] font-black uppercase tracking-[0.16em] text-amber-50">Secure Identity Check</p>
          </div>
          <h2 className="mt-5 max-w-3xl break-words text-3xl font-black leading-[1.04] text-white sm:text-4xl lg:text-5xl">{copy.title}</h2>
          <p className="wallet-red-soft mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/82 sm:text-base">{copy.description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:max-w-4xl">
            {[
              ["Required Docs", `${uploadedCount}/${requiredCount}`, "Uploaded"],
              ["Review Time", "48 hrs", "Typical window"],
              ["Access", status === "VERIFIED" ? "Unlocked" : "Protected", "Wallet features"],
            ].map(([label, value, helper]) => (
              <div key={label} className="rounded-2xl border border-white/12 bg-white/[0.09] p-4 backdrop-blur">
                <p className="wallet-red-muted text-[10px] font-black uppercase tracking-[0.12em] text-white/55">{label}</p>
                <p className="mt-2 text-2xl font-black leading-none text-white">{value}</p>
                <p className="wallet-red-soft mt-2 text-xs font-semibold text-white/65">{helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ProgressStepper = ({
  documentSteps,
  currentStep,
  completedSteps,
}: {
  documentSteps: DocumentStep[];
  currentStep: number;
  completedSteps: Set<number>;
}) => (
  <div className="grid gap-3 sm:grid-cols-3">
    {documentSteps.map((step) => {
      const complete = completedSteps.has(step.step);
      const active = currentStep === step.step && !complete;
      return (
        <div
          key={step.docType}
          className={`rounded-2xl border p-4 transition ${
            complete
              ? "border-emerald-200 bg-[#ECFDF5]"
              : active
                ? "border-[#C8103E]/30 bg-[#FFF1F4]"
                : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                complete
                  ? "bg-emerald-600 text-white"
                  : active
                    ? "bg-[#C8103E] text-white"
                    : "bg-white text-[#64748B]"
              }`}
            >
              {complete ? <CheckCircle2 className="h-5 w-5" /> : step.step}
            </span>
            <div className="min-w-0">
              <p className="font-black text-[#0F172A]">{step.shortLabel}</p>
              <p className="mt-1 text-xs text-[#64748B]">{complete ? "Completed" : step.description}</p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const DocumentUploadCard = ({
  doc,
  uploaded,
  selectedFile,
  uploading,
  onFileChange,
  onUpload,
}: {
  doc: DocumentStep;
  uploaded: boolean;
  selectedFile: File | null;
  uploading: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}) => (
  <article className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${uploaded ? "bg-[#ECFDF5] text-emerald-600" : "bg-[#FFF1F4] text-[#C8103E]"}`}>
          {uploaded ? <FileCheck2 className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#64748B]">
              Step {doc.step}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${uploaded ? "bg-emerald-50 text-emerald-700" : doc.required ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-[#64748B]"}`}>
              {uploaded ? "Uploaded" : doc.required ? "Required" : "Optional"}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-black text-[#0F172A]">{doc.label}</h3>
          <p className="mt-1 text-sm text-[#64748B]">{doc.description}</p>
          <p className="mt-2 text-xs font-semibold text-[#64748B]">{doc.helper}</p>
        </div>
      </div>
    </div>

    {doc.docType === "LEGAL_AGREEMENT" && (
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-[#ECFDF5] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">Download the agreement, sign it, then upload the completed file.</p>
          </div>
          <a
            href="/sgnx-gold-kyc-risk-acknowledgement-v1.3.pdf"
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/25"
          >
            <FileText className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
    )}

    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px] lg:items-center">
      <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-[#C8103E]/50 hover:bg-[#FFF1F4]/50">
        <span className="block text-sm font-black text-[#0F172A]">{selectedFile?.name || "Choose file"}</span>
        <span className="mt-1 block text-xs text-[#64748B]">Images or PDF files are supported.</span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      <Button
        type="button"
        onClick={onUpload}
        disabled={uploading}
        className="wallet-red-control h-12 rounded-2xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] text-white hover:from-[#C8103E] hover:to-[#68001A] disabled:opacity-60"
      >
        {uploading ? "Uploading..." : uploaded ? "Re-upload" : "Upload"}
      </Button>
    </div>
  </article>
);

const SubmitReviewCard = ({
  canSubmit,
  submitting,
  onSubmit,
}: {
  canSubmit: boolean | null;
  submitting: boolean;
  onSubmit: () => void;
}) => (
  <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF5] text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-[#0F172A]">Submit for Review</h3>
          <p className="mt-1 text-sm text-[#64748B]">Upload all required documents, then send your profile for admin verification.</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="wallet-red-control h-12 w-full rounded-2xl bg-gradient-to-r from-[#D4143F] to-[#7A001F] px-6 text-white hover:from-[#C8103E] hover:to-[#68001A] disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit for Review"}
        {!submitting && <CheckCircle2 className="ml-2 h-5 w-5" />}
      </Button>
    </div>
    {!canSubmit && (
      <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        All required SGNX Gold KYC v1.3 documents are needed before final submission.
      </p>
    )}
  </section>
);

const StatusResultCard = ({ status }: { status: KycStatus }) => {
  const copy = statusCopy[status.status];
  const StatusIcon = getStatusIcon(status.status);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-10">
      <span className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${copy.iconClass}`}>
        <StatusIcon className="h-10 w-10" />
      </span>
      <h2 className="mt-6 text-3xl font-black text-[#0F172A]">{copy.title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-[#64748B] sm:text-base">
        {status.status === "REJECTED" && status.rejectionReason
          ? `Reason: ${status.rejectionReason}`
          : copy.description}
      </p>
    </section>
  );
};

const LoadingSkeleton = () => (
  <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-36 rounded-3xl" />
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  </main>
);

export default function KycPage() {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [applicantType, setApplicantType] = useState<ApplicantType>("INDIVIDUAL");
  const [entityType, setEntityType] = useState(entityTypeOptions[0]);
  const [selectedFiles, setSelectedFiles] = useState<Record<DocType, File | null>>({
    LEGAL_AGREEMENT: null,
    PAN: null,
    ID_FRONT: null,
    ID_BACK: null,
    BANK_PROOF: null,
    RECENT_ADDRESS: null,
    PHOTO_VERIFICATION: null,
    CONSTITUTIONAL_DOCS: null,
    AUTHORITY_DOC: null,
    OWNERSHIP_CHART: null,
    SOURCE_OF_FUNDS: null,
    TAX_RESIDENCY: null,
    GOLD_INVOICE_CUSTODY: null,
  });
  const documentSteps = documentStepsByApplicantType[applicantType];
  const requiredDocumentSteps = documentSteps.filter((doc) => doc.required);

  const fetchKycStatus = async () => {
    try {
      const status = await getKycStatus();
      if (status && !status.error) {
        setKycStatus(status);
        if (status.applicantType === "ENTITY" || status.applicantType === "INDIVIDUAL") {
          setApplicantType(status.applicantType);
        }
        if (status.entityType) {
          setEntityType(status.entityType);
        }
      } else {
        setMessage(status.error || "Could not load your KYC information.");
      }
    } catch (error) {
      console.error("Failed to fetch KYC status", error);
      setMessage("Could not load your KYC information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchKycStatus();
  }, []);

  const derived = useMemo(() => {
    const uploadedCount = requiredDocumentSteps.filter((doc) => isDocUploaded(kycStatus, doc.docType)).length;
    const progressPercent = kycStatus?.status === "VERIFIED" ? 100 : Math.round((uploadedCount / requiredDocumentSteps.length) * 100);
    const currentStep =
      requiredDocumentSteps.find((doc) => !isDocUploaded(kycStatus, doc.docType))?.step ?? requiredDocumentSteps.length;
    const completedSteps = new Set<number>();
    documentSteps.forEach((doc) => {
      if (isDocUploaded(kycStatus, doc.docType)) completedSteps.add(doc.step);
    });
    const canSubmit =
      kycStatus &&
      requiredDocumentSteps.every((doc) =>
        kycStatus.documents.some((uploadedDoc) => uploadedDoc.docType === doc.docType && uploadedDoc.kycVersion === CURRENT_KYC_VERSION)
      );

    return { uploadedCount, progressPercent, currentStep, completedSteps, canSubmit };
  }, [documentSteps, kycStatus, requiredDocumentSteps]);

  if (loading) return <LoadingSkeleton />;

  const status = kycStatus?.status ?? "NOT_SUBMITTED";
  const canEdit = status === "NOT_SUBMITTED" || status === "REQUIRES_REKYC" || status === "REJECTED";

  const handleFileChange = (docType: DocType, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleUpload = async (docType: DocType) => {
    const file = selectedFiles[docType];
    const doc = documentSteps.find((item) => item.docType === docType);

    if (!file) {
      setMessage(`Please select a file for ${doc?.label || "this document"}.`);
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
        setMessage(`Failed to upload ${doc?.label || "document"}: ${uploadResult.error}`);
        return;
      }
      setKycStatus(uploadResult.kyc);
      setSelectedFiles((prev) => ({ ...prev, [docType]: null }));
      setMessage(`${doc?.label || "Document"} uploaded successfully.`);
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
      const result = await submitKycForReview({
        applicantType,
        entityType: applicantType === "ENTITY" ? entityType : undefined,
      });
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(result.message);
        setKycStatus(result.kyc);
      }
    } catch (err) {
      console.error(err);
      setMessage("An unexpected error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dashboard-light-scope min-h-screen overflow-x-hidden bg-[#F8FAFC] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <KycHeader status={status} />
        <KycHeroCard status={status} uploadedCount={derived.uploadedCount} requiredCount={requiredDocumentSteps.length} />

        {status === "REJECTED" && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-[#FFF1F4] px-4 py-3 text-sm font-semibold text-[#C8103E]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Submission rejected{kycStatus?.rejectionReason ? `: ${kycStatus.rejectionReason}` : "."} Please re-upload the documents and submit again.
            </p>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        {canEdit ? (
          <>
            <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-[#0F172A]">Applicant Type</h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Select the KYC path that matches this account. Required documents change based on this selection.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                  {(["INDIVIDUAL", "ENTITY"] as ApplicantType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setApplicantType(type)}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${
                        applicantType === type
                          ? "border-[#C8103E] bg-[#FFF1F4] text-[#C8103E]"
                          : "border-slate-200 bg-slate-50 text-[#0F172A] hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-sm font-black">{type === "INDIVIDUAL" ? "Individual" : "Entity"}</span>
                      <span className="mt-1 block text-xs font-semibold text-[#64748B]">
                        {type === "INDIVIDUAL" ? "Personal KYC documents" : "Company, firm, trust, or other entity"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {applicantType === "ENTITY" && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-black text-[#0F172A]" htmlFor="entity-type">
                    Entity Type
                  </label>
                  <select
                    id="entity-type"
                    value={entityType}
                    onChange={(event) => setEntityType(event.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#C8103E] focus:ring-2 focus:ring-[#C8103E]/15"
                  >
                    {entityTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-semibold text-[#64748B]">
                    Entity KYC requires entity PAN, signatory/UBO proof, office proof, constitutional documents, authority document, ownership chart, bank proof, and tax self-certification.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A]">Verification Steps</h2>
                  <p className="mt-1 text-sm text-[#64748B]">Complete required documents to submit your KYC for review. Optional documents can be uploaded if applicable.</p>
                </div>
                <p className="text-sm font-black text-[#C8103E]">{derived.progressPercent}% complete</p>
              </div>
              <ProgressStepper documentSteps={requiredDocumentSteps} currentStep={derived.currentStep} completedSteps={derived.completedSteps} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
              <div className="space-y-5">
                {documentSteps.map((doc) => (
                  <DocumentUploadCard
                    key={doc.docType}
                    doc={doc}
                    uploaded={isDocUploaded(kycStatus, doc.docType)}
                    selectedFile={selectedFiles[doc.docType]}
                    uploading={uploading === doc.docType}
                    onFileChange={(file) => handleFileChange(doc.docType, file)}
                    onUpload={() => handleUpload(doc.docType)}
                  />
                ))}
              </div>

              <aside className="space-y-5">
                <SubmitReviewCard canSubmit={derived.canSubmit} submitting={submitting} onSubmit={handleFinalSubmit} />
                <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                  <LockKeyhole className="h-8 w-8 text-[#C8103E]" />
                  <h3 className="mt-4 text-lg font-black text-[#0F172A]">Secure Review</h3>
                  <p className="mt-2 text-sm text-[#64748B]">Your documents are used only for identity verification and admin compliance review.</p>
                  <div className="mt-5 space-y-3">
                    {[
                      ["Encrypted uploads", ShieldCheck],
                      ["Admin reviewed", FileCheck2],
                      ["Wallet protection", Fingerprint],
                    ].map(([label, Icon]) => (
                      <div key={label as string} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                        <Icon className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-bold text-[#0F172A]">{label as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </section>
          </>
        ) : (
          <StatusResultCard status={kycStatus || { status, documents: [] }} />
        )}

        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-[#ECFDF5] px-4 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:px-5">
          <ShieldCheck className="h-8 w-8 text-emerald-700" />
          <div className="min-w-0">
            <p className="text-lg font-black text-emerald-700">Verified accounts keep the SAGENEX ecosystem safer.</p>
            <p className="mt-1 text-sm text-emerald-800/80">Complete the latest SGNX Gold KYC to improve trust, withdrawal readiness, and reward eligibility.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={fetchKycStatus}
            className="h-11 rounded-xl border-emerald-200 bg-white font-black text-emerald-700 hover:bg-emerald-50 sm:ml-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </section>
      </div>
    </main>
  );
}
