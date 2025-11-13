// components/Footer.tsx
"use client";

import {  Twitter, Youtube, Linkedin, Github } from "lucide-react";
import Link from "next/link";

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#07140E] text-white">
      {/* soft vignette + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 70% at 15% 0%, rgba(16,185,129,.10), transparent 60%), radial-gradient(55% 60% at 85% 40%, rgba(0,120,80,.08), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.05)_1px,transparent_2px)] bg-[length:42px_100%] opacity-10" />

      {/* top gold divider */}
      <div className={`relative h-[3px] w-full bg-gradient-to-r ${GOLD}`} />

      <div className="relative mx-auto max-w-7xl px-6 py-14 md:py-20">
        {/* CTA band */}
        {/* <div className="rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-[#0F241B] to-[#0A1813] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,.45)]">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">
                <span className="text-white/95">Join Sagenex — </span>
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${GOLD}`}>
                  Innovation. Trust. Growth.
                </span>
              </h3>
              <p className="mt-2 text-sm md:text-[15px] text-white/80">
                Where Artificial Intelligence meets Financial Precision. Be first to get updates, insights, and early access.
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="w-full max-w-lg md:w-auto"
              aria-label="Subscribe to newsletter"
            >
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" aria-hidden />
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-3 text-sm text-white placeholder-white/50 outline-none ring-emerald-400/30 focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-3 text-sm font-semibold text-black hover:brightness-95 active:brightness-90"
                >
                  Subscribe <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="mt-2 text-xs text-white/60">
                By subscribing, you agree to our{" "}
                <Link href="/terms" className="underline decoration-white/30 hover:decoration-white">
                  Terms
                </Link>{" "}
                &{" "}
                <Link href="/privacy" className="underline decoration-white/30 hover:decoration-white">
                  Privacy Policy
                </Link>.
              </p>
            </form>
          </div>
        </div> */}

        {/* link columns */}
        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3">
              {/* replace with your logo */}
              {/* <div className="h-8 w-8 rounded-full bg-emerald-400/20 ring-1 ring-emerald-400/30" /> */}
              <span className="text-xl font-semibold tracking-wide">Sagenex</span>
            </Link>
            <p className="mt-3 text-sm text-white/75 max-w-sm">
              A global wealth ecosystem uniting AI, real-world assets, and community power. Built with transparency and performance at its core.
            </p>

            {/* social */}
            <div className="mt-4 flex items-center gap-3">
              <Link aria-label="Twitter/X" href="#" className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                <Twitter className="h-4 w-4 text-white/80" aria-hidden />
              </Link>
              <Link aria-label="YouTube" href="#" className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                <Youtube className="h-4 w-4 text-white/80" aria-hidden />
              </Link>
              <Link aria-label="LinkedIn" href="#" className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                <Linkedin className="h-4 w-4 text-white/80" aria-hidden />
              </Link>
              <Link aria-label="GitHub" href="#" className="rounded-lg border border-white/10 p-2 hover:bg-white/5">
                <Github className="h-4 w-4 text-white/80" aria-hidden />
              </Link>
            </div>
          </div>

          {/* columns */}
          <FooterCol
            title="Company"
            links={[
              { href: "#about-us", label: "About" },
              { href: "#academy", label: "Academy" },
              { href: "#earning", label: "Earning" },
              { href: "#card", label: "Cash Card" },
              { href: "#coin", label: "SGCoin" },
            ]}
          />


          <FooterCol
            title="Resources"
            links={[
              { label: "Whitepaper", href: "/Sagenex-USA-SGCOIN.pdf", download: true },
              { label: "Compliance (KYC/AML)", href: "/kyc" },
            ]}
          />
        </div>

        {/* bottom ribbon */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center">
            <p className="text-xs text-white/65">
              © {year} Sagenex. All rights reserved. |
              {" "}
              <Link href="/privacy" className="underline decoration-white/30 hover:decoration-white">Privacy</Link>
              {" · "}
              <Link href="/terms" className="underline decoration-white/30 hover:decoration-white">Terms</Link>
            </p>

           
          </div>
        </div>
      </div>

      {/* bottom fade */}
      <div className="pointer-events-none h-14 w-full bg-gradient-to-b from-transparent to-black/60" />
    </footer>
  );
}

/* helper for link columns */
function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; download?: boolean }[];
}) {
  return (
    <div>
      <div className="text-sm font-semibold tracking-wide text-white/90">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-white/70 hover:text-white/90 hover:underline decoration-white/20"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
