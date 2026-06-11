import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/components/landing/footer";

const sections = [
  {
    title: "Information We Collect",
    body: [
      "We only ask for personal information when we need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.",
      "We let you know why we collect information and how it will be used.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We retain collected information only as long as necessary to provide requested services.",
      "Stored data is protected within commercially acceptable means to prevent loss, theft, unauthorized access, disclosure, copying, use, or modification.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "We use cookies to help improve your website experience. This cookie policy is part of Sagenex's privacy policy and covers cookie use between your device and our site.",
    ],
  },
  {
    title: "Third-Party Services",
    body: [
      "We may employ third-party companies and individuals, including analytics providers and content partners.",
      "These third parties access personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for other purposes.",
    ],
  },
  {
    title: "Changes to This Policy",
    body: [
      "We may update our Privacy Policy from time to time. Updates will be posted on this page.",
      "This policy is effective as of 23 October 2025.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar theme="dark" />
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-36 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/15 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Home
        </Link>

        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Legal
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70 md:text-lg">
            Your privacy is important to us. It is Sagenex&apos;s policy to respect your privacy regarding any information
            we may collect from you across our website and other sites we own and operate.
          </p>
        </div>

        <div className="mt-12 space-y-10 border-t border-white/10 pt-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-white/70">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-bold text-white">Contact</h2>
            <p className="mt-4 text-base leading-7 text-white/70">
              If you have any questions about how we handle user data and personal information, contact support@sagenex.io.
            </p>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}
