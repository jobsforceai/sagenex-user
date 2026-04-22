"use client";

import { Twitter, Youtube, Linkedin, Github } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="section-dark relative overflow-hidden border-t border-[var(--border-dark)] pt-20 pb-10">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.05)_1px,transparent_2px)] bg-[length:42px_100%]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        
        {/* Top Brand & Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-[var(--border-dark)]">
          
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <span className="font-display font-extrabold text-3xl tracking-tight text-black">
                SAGE<span className="text-[var(--crimson)]">NEX</span>
              </span>
            </Link>
            <p className="text-[var(--text-muted-dark)] mb-8 leading-relaxed max-w-xs text-sm">
              A global wealth ecosystem uniting AI, real-world assets, and community power. Built with transparency and performance at its core.
            </p>
            <div className="flex items-center gap-4">
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
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-[var(--text-muted-dark)]">
            &copy; {year} Sagenex. All rights reserved.
          </p>
          <div className="text-[13px] text-[var(--text-muted-dark)] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--emerald)]"></span>
            All systems operational
          </div>
        </div>

      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon }: { icon: any }) {
  return (
    <Link href="#" className="w-10 h-10 rounded-full border border-[var(--border-dark)] flex items-center justify-center text-white/70 hover:text-[var(--emerald)] hover:border-[var(--emerald)] transition-all bg-white/5">
      <Icon size={18} />
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-white font-bold mb-6 font-display">{title}</h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-[var(--text-muted-dark)] hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
