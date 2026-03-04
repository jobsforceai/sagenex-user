"use client";

import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import { Button } from "@/components/ui/button";

export default function LotteryPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 text-center">
        <h1 className="text-3xl font-semibold">Lottery is temporarily unavailable</h1>
        <p className="mt-3 text-sm text-white/70">
          This feature is currently disabled. Please check back later.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
