"use client";

import { Twitter, Youtube, Linkedin, Github, ArrowUp } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="landing-section-light relative overflow-hidden border-t border-[var(--landing-border-light)] pt-14 sm:pt-16 pb-8">
      {/* Subtle background line pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(15,23,42,0.5)_1px,transparent_2px)] bg-[length:42px_100%]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* Top Brand & Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 pb-12 sm:pb-14 border-b border-[var(--landing-border-light)]">

          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-block mb-5">
              <span className="font-display font-extrabold text-2xl tracking-tight text-[var(--landing-text-dark)]">
                SAGE<span className="text-[var(--crimson)]">NEX</span>
              </span>
            </Link>
            <p className="text-[var(--landing-text-muted)] mb-6 leading-relaxed max-w-xs text-sm">
              A global wealth ecosystem uniting AI, real-world assets, and community power. Built with transparency and performance at its core.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink icon={Twitter} />
              <SocialLink icon={Youtube} />
              <SocialLink icon={Linkedin} />
              <SocialLink icon={Github} />
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterCol
              title="Ecosystem"
              links={[
                { label: "Trading Platform", href: "https://sg5trader.sgxmeta.ai" },
                { label: "SGChain", href: "https://sgchain.sgxmeta.ai" },
                { label: "SGGOLD Rewards", href: "https://sggold.sgxmeta.ai/" },
                { label: "Business Network", href: "https://sgbn.sgxmeta.ai" },
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: "About Us", href: "#about" },
                { label: "Academy", href: "#academy" },
                { label: "Roadmap", href: "#roadmap" },
                { label: "Mobile App", href: "#app" },
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

        {/* Bottom Banner */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[13px] text-[var(--landing-text-muted)]">
            &copy; {year} Sagenex. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-[13px] text-[var(--landing-text-muted)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--emerald)]" />
              All systems operational
            </div>
            <button
              onClick={scrollToTop}
              className="h-9 w-9 rounded-xl border border-[var(--landing-border-light)] bg-white flex items-center justify-center text-[var(--landing-text-muted)] hover:text-[var(--crimson)] hover:border-[var(--crimson)]/30 transition-all shadow-sm"
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon }: { icon: typeof Twitter }) {
  return (
    <Link href="#" className="w-9 h-9 rounded-xl border border-[var(--landing-border-light)] flex items-center justify-center text-[var(--landing-text-muted)] hover:text-[var(--emerald)] hover:border-[var(--emerald)] transition-all bg-white shadow-sm">
      <Icon size={16} />
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-[var(--landing-text-dark)] font-bold mb-5 font-display text-sm">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--crimson)] transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
