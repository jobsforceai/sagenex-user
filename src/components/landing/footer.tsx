"use client";

import Link from "next/link";

const FALLBACK_ANDROID_APP_URL =
  "https://sagenex-academy-videos.s3.ap-south-1.amazonaws.com/androidapp/application-5e16bdb5-efe6-4d39-8099-b7acb047d4f7.apk";

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export default function Footer() {
  const year = new Date().getFullYear();
  const sgChainUrl = process.env.NEXT_PUBLIC_SGCHAIN_URL || "https://sgchain.sgxmeta.ai";
  const sg5TradersUrl = process.env.NEXT_PUBLIC_SG5TRADERS_URL || "https://sg5trader.sgxmeta.ai";
  const androidAppUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL || FALLBACK_ANDROID_APP_URL;

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-[#f8f9fa] pt-20 pb-10 text-[#0A0A0A]">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(15,23,42,.06)_1px,transparent_2px)] bg-[length:42px_100%]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-slate-200">
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-block mb-5">
              <span className="font-display font-extrabold text-2xl tracking-tight text-[var(--landing-text-dark)]">
                SAGE<span className="text-[var(--crimson)]">NEX</span>
              </span>
            </Link>
            <p className="text-[#52525b] mb-8 leading-relaxed max-w-xs text-sm">
              A global wealth ecosystem uniting AI, real-world assets, and community power. Built with transparency and performance at its core.
            </p>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterCol
              title="Ecosystem"
              links={[
                { label: "Trading Platform", href: sg5TradersUrl, external: true },
                { label: "SGChain", href: sgChainUrl, external: true },
                { label: "SGGOLD Rewards", href: "https://sggold.sgxmeta.ai/", external: true },
                { label: "Business Network", href: "/sgbn" },
                { label: "SGSE", href: "/sgse" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "About Us", href: "/about-us" },
                { label: "Academy", href: "/courses" },
                { label: "Roadmap", href: "/timeline" },
                { label: "Mobile App", href: androidAppUrl, external: true },
              ]}
            />
            <FooterCol
              title="Legal & Resources"
              links={[
                { label: "Whitepaper", href: "/whitepaper" },
                { label: "KYC / AML", href: "/kyc" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ]}
            />
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[#52525b]">
            &copy; {year} Sagenex. All rights reserved.
          </p>
          <div className="text-[13px] text-[#52525b] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--emerald)]" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h4 className="text-base text-[#0A0A0A] font-bold mb-6 font-display md:text-lg">{title}</h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-base text-[#52525b] hover:text-[var(--crimson)] transition-colors"
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
