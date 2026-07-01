"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileImage,
  FileText,
  LifeBuoy,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

const platforms = ["SGXMeta", "SGGold", "SGBN", "SGSE", "SGChain", "SG5Trader"];

const processSteps = [
  {
    title: "Submit",
    text: "Raise one clear complaint with platform, SGX User ID or guest contact details, issue title, and proof.",
  },
  {
    title: "Admin review",
    text: "The control desk checks ownership, priority, duplicate tickets, and whether the proof is usable.",
  },
  {
    title: "Team action",
    text: "The assigned platform or developer team investigates, adds progress notes, and requests more proof if needed.",
  },
  {
    title: "Approval",
    text: "Admin confirms the resolution, closes the ticket, or sends it back if the issue needs more work.",
  },
];

const includeRules = [
  "Correct platform name and SGX User ID if available.",
  "A short complaint title that explains the exact issue.",
  "Transaction ID, reference ID, date, time, and amount when money is involved.",
  "What happened, what you expected, and what resolution you want.",
];

const attachmentRules = [
  "Screenshots must be clear, readable, and uncropped.",
  "Payment proof must show amount, date, sender/receiver, and reference ID.",
  "Upload up to 3 files, maximum 5 MB each.",
  "Supported files: JPG, PNG, WEBP, PDF, DOC, and XLS.",
];

const avoidRules = [
  "Do not create duplicate tickets for the same issue.",
  "Do not combine unrelated platform issues in one ticket.",
  "Do not upload edited, blurry, or incomplete proof.",
  "Do not submit guest tickets without reachable contact details.",
];

const statuses = [
  ["Pending", "Your ticket is received and waiting for first review."],
  ["Assigned", "The correct team has ownership of the ticket."],
  ["In Progress", "The team is actively checking or fixing the issue."],
  ["Approval", "The ticket is waiting for admin confirmation."],
  ["Resolved", "The issue is closed after review."],
  ["Rejected", "The ticket was invalid, duplicate, or missing required proof."],
];

const SupportGuidelinesPage = () => {
  return (
    <main className="min-h-screen bg-[#EEF3F7] text-[#17212F]">
      <header className="border-b border-[#C9D4E2] bg-[#1E4169] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-black tracking-tight">
            Sagenex Ticketing System
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold text-white/82">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <Link href="/support" className="transition hover:text-white">Raise Complaint</Link>
            <Link href="/expenses" className="transition hover:text-white">Track</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[4px] border border-[#C9D4E2] bg-white shadow-[0_18px_45px_rgba(30,65,105,0.08)]">
          <div className="grid min-h-[380px] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-sm font-black text-[#1E4169]">SupportHub guidance</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#17212F] sm:text-5xl">
                Ticket rules for faster complaint resolution.
              </h1>
              <p className="mt-5 max-w-3xl text-lg font-semibold leading-7 text-[#667389]">
                Use this guide before raising a complaint. It explains what to submit, what proof is valid,
                and how every ticket moves from submission to admin approval.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/support"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#0F8178] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,129,120,0.2)] transition hover:bg-[#0B6C65]"
                >
                  Raise Complaint
                </Link>
                <Link
                  href="/expenses"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#455568] px-5 text-sm font-black text-white transition hover:bg-[#354253]"
                >
                  Track Existing Ticket
                </Link>
              </div>
            </div>

            <div className="relative border-t border-[#D8E0EA] bg-[#F8FAFC] p-6 lg:border-l lg:border-t-0 lg:p-10">
              <div className="absolute inset-x-10 top-24 h-6 bg-linear-to-r from-[#D8E0EA] via-[#EEF3F7] to-transparent" />
              <div className="absolute inset-x-16 top-40 h-6 bg-linear-to-r from-[#E5ECEF] via-[#F8FAFC] to-transparent" />
              <div className="relative ml-auto mt-4 max-w-md rounded-[4px] border border-[#B8C7D8] bg-white p-4 shadow-[0_18px_45px_rgba(30,65,105,0.14)]">
                <div className="flex items-center justify-between border-b border-[#C9D4E2] pb-3">
                  <h2 className="text-lg font-black">Guidance checklist</h2>
                  <span className="text-xs font-bold text-[#667389]">Before submit</span>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["Platform selected", "SGXMeta, SGGold, SGBN, SGSE, SGChain, or SG5Trader"],
                    ["Identity verified", "SGX User ID or guest contact details"],
                    ["Proof attached", "Screenshots, payment proof, or reference document"],
                  ].map(([label, helper]) => (
                    <div key={label} className="grid grid-cols-[1fr_auto] gap-3 border border-[#D8E0EA] bg-[#F8FAFC] p-3">
                      <div>
                        <p className="font-black">{label}</p>
                        <p className="mt-1 text-xs font-semibold text-[#667389]">{helper}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-[#0F8178]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-5 rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-black">How complaints move</h2>
              <p className="mt-1 font-semibold text-[#667389]">
                Every ticket follows a controlled review path from submission to admin approval.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <article key={step.title} className="border border-[#D8E0EA] bg-[#F8FAFC] p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center bg-[#1E4169] text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-black">{step.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#667389]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <LifeBuoy className="h-6 w-6 text-[#0F8178]" />
              <h2 className="text-2xl font-black">Covered platforms</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {platforms.map((platform) => (
                <div key={platform} className="border border-[#C9D4E2] bg-[#F8FAFC] px-3 py-3 text-center text-sm font-black">
                  {platform}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[4px] border-l-4 border-[#0F8178] bg-[#F4FBFA] p-4">
              <p className="text-sm font-bold text-[#405066]">
                Select the exact product where the issue happened. Wrong platform selection can delay assignment.
              </p>
            </div>
          </section>

          <section className="rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-[#0F8178]" />
              <h2 className="text-2xl font-black">What your ticket must include</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {includeRules.map((rule) => (
                <div key={rule} className="flex gap-3 border border-[#D8E0EA] bg-[#F8FAFC] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F8178]" />
                  <p className="text-sm font-semibold leading-6 text-[#405066]">{rule}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <UploadCloud className="h-6 w-6 text-[#0F8178]" />
              <h2 className="text-xl font-black">Attachment rules</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {attachmentRules.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm font-semibold leading-6 text-[#405066]">
                  <FileImage className="mt-1 h-4 w-4 shrink-0 text-[#667389]" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-[#D97706]" />
              <h2 className="text-xl font-black">Do not submit</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {avoidRules.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm font-semibold leading-6 text-[#405066]">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#D97706]" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#0F8178]" />
              <h2 className="text-xl font-black">Audit ready</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                "Every status change is tracked.",
                "Developer proof is separate from member proof.",
                "Admin approval is required before closure.",
                "Rejected tickets should explain the missing requirement.",
              ].map((rule) => (
                <li key={rule} className="flex gap-3 text-sm font-semibold leading-6 text-[#405066]">
                  <LockKeyhole className="mt-1 h-4 w-4 shrink-0 text-[#667389]" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-5 rounded-[4px] border border-[#C9D4E2] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <SearchCheck className="h-6 w-6 text-[#0F8178]" />
            <h2 className="text-2xl font-black">Ticket status guide</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {statuses.map(([status, meaning]) => (
              <div key={status} className="border border-[#D8E0EA] bg-[#F8FAFC] p-4">
                <p className="text-sm font-black text-[#1E4169]">{status}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#667389]">{meaning}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-4 rounded-[4px] border border-[#C9D4E2] border-l-4 border-l-[#0F8178] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Need support now?</h2>
            <p className="mt-1 font-semibold text-[#667389]">
              Raise a ticket with your SGX User ID, or continue as a guest with reachable contact details.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/support"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#0F8178] px-5 text-sm font-black text-white transition hover:bg-[#0B6C65]"
            >
              Raise Complaint
            </Link>
            <Link
              href="/expenses"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#455568] px-5 text-sm font-black text-white transition hover:bg-[#354253]"
            >
              Track Existing Ticket
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        <footer className="mt-5 mb-8 flex flex-col gap-2 border border-[#C9D4E2] bg-white px-5 py-4 text-sm font-semibold text-[#667389] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-[#17212F]">Sagenex Ticketing System</p>
            <p>Complaint desk rules for SGX platforms</p>
          </div>
          <p>© 2026 Sagenex. Made for the Sagenex family.</p>
        </footer>
      </section>
    </main>
  );
};

export default SupportGuidelinesPage;
