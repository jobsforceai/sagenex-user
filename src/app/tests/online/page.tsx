"use client";

import Navbar from "@/app/components/Navbar";

export default function OnlineTestPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 text-center">
        <h1 className="text-3xl font-semibold">Online Exam is temporarily unavailable</h1>
        <p className="mt-3 text-sm text-white/70">
          This feature is currently disabled. Please check back later.
        </p>
      </div>
    </div>
  );
}
