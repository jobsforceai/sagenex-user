"use client";

import Image from "next/image";
import Link from "next/link";

const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-black">
      <div className={`${container} grid gap-8 py-12 md:grid-cols-4`}>
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/logo5.png" alt="Sagenex" fill className="object-contain" />
            </div>
            <span className="font-semibold">Sagenex</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-zinc-400">
            A global ecosystem blending AI, blockchain and real-world assets to help leaders scale responsibly.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li><Link href="/login" className="hover:text-white">About Us</Link></li>
            <li><Link href="/login" className="hover:text-white">Timeline</Link></li>
            <li><Link href="/login" className="hover:text-white">Levels</Link></li>
            <li><Link href="/login" className="hover:text-white">Packages</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Contact</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>Dubai · Business Bay</li>
            <li>San Francisco · 455 Market St</li>
            <li><a href="mailto:support@sagenex.io" className="hover:text-white">support@sagenex.io</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={`${container} flex flex-col items-center justify-between py-5 text-xs text-zinc-500 sm:flex-row`}>
          <div>© {new Date().getFullYear()} Sagenex L.L.C. All rights reserved.</div>
          <div className="mt-3 flex items-center gap-4 sm:mt-0">
            <Link href="#" className="hover:text-zinc-300">Terms</Link>
            <Link href="#" className="hover:text-zinc-300">Privacy</Link>
            <Link href="#" className="hover:text-zinc-300">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function LevelsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">Ranks & Recognition</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Show rank criteria, responsibilities, and monthly recognition with a clear matrix. Add caps, re-entry and sustainability notes.
        </p>
      </div>
    </div>
  );
}

export function PackagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white">
      <div className={`${container} py-24`}>
        <h1 className="text-3xl font-semibold">Packages</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Convert the Academy tiers into purchasable packages. Include feature comparison, e-wallet equivalence, and KYC requirements.
        </p>
      </div>
    </div>
  );
}
