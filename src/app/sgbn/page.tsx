"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import Footer from "@/components/landing/footer";
import HeroButton from "@/components/ui/hero-button";
import {
  Building2,
  Users,
  TrendingUp,
  Briefcase,
  Award,
  Globe,
  Handshake,
  Target,
  Shield,
  Calendar,
  DollarSign,
  CheckCircle,
  Sparkles,
  Network,
  UserPlus,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";
const EMERALD = "from-emerald-400 via-emerald-500 to-emerald-600";

type Pillar = {
  title: string;
  description: string;
  icon: React.ElementType;
};

type MembershipTier = {
  name: string;
  price: string;
  period: string;
  benefits: string[];
  accent: string;
  popular?: boolean;
};

type Benefit = {
  audience: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
};

const pillars: Pillar[] = [
  {
    title: "Structured Referrals",
    description: "Networking with intent, not randomness",
    icon: Network,
  },
  {
    title: "Exclusive Business Chapters",
    description: "One business per category rule for integrity",
    icon: Shield,
  },
  {
    title: "Community Movements",
    description: "Support systems that scale ideas",
    icon: Users,
  },
  {
    title: "Hiring & Collaboration",
    description: "Business to freelancer & founder hiring pipeline",
    icon: Briefcase,
  },
];

const membershipTiers: MembershipTier[] = [
  {
    name: "Business Membership",
    price: "$120",
    period: "/year",
    benefits: [
      "Category lock protection",
      "Reporting & chapter access",
      "Reinvestment opportunities",
      "Monthly chapter meetings",
      "Online global sessions",
    ],
    accent: "from-amber-400 to-yellow-600",
    popular: true,
  },
  {
    name: "Freelancer Membership",
    price: "$60",
    period: "/year",
    benefits: [
      "Work leads & opportunities",
      "Skill-based earning",
      "Hiring & collaboration access",
      "SGSE mentorship programs",
      "Global networking sessions",
    ],
    accent: "from-emerald-400 to-green-600",
  },
];

const whyStandOut = [
  { text: "Real business value, not hype", icon: CheckCircle },
  { text: "Community-first model", icon: Users },
  { text: "SGSE ecosystem-backed", icon: Globe },
  { text: "Designed for long-term growth", icon: TrendingUp },
];

const whoBenefits: Benefit[] = [
  {
    audience: "Business Owners",
    description: "Leads, expansion, trust, credibility",
    icon: Building2,
    gradient: "from-blue-400 to-cyan-600",
  },
  {
    audience: "Freelancers",
    description: "Skill monetization, clients, service portfolio",
    icon: Briefcase,
    gradient: "from-purple-400 to-pink-600",
  },
  {
    audience: "Community",
    description: "Shared prosperity, hiring network",
    icon: Handshake,
    gradient: "from-emerald-400 to-green-600",
  },
  {
    audience: "Families",
    description: "Financial & relationship pathways for future stability",
    icon: UserPlus,
    gradient: "from-amber-400 to-orange-600",
  },
];

export default function SGBNPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero animation
      gsap.fromTo(
        ".sgbn-hero-title",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".sgbn-hero-title",
            start: "top 85%",
          },
        }
      );

      // Section animations
      gsap.utils.toArray(".sgbn-section").forEach((section: any) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Large circular glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 sm:opacity-60 w-[800px] h-[800px] aspect-square backdrop-blur-[150px] sm:backdrop-blur-[250px] bg-[radial-gradient(circle,rgba(16,185,129,0.3)_0%,rgba(0,0,0,0)_70%)]" />

        {/* Spotlight effect */}
        <div className="absolute top-0 right-1/12 -rotate-10 z-10 hidden sm:block opacity-30">
          <div className="w-[550px] h-[550px] bg-[conic-gradient(from_200deg_at_50%_0%,rgba(252,231,154,.25),rgba(252,231,154,0)_55%)] blur-2xl" />
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-[2px] w-[2px] rounded-full bg-emerald-200/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
                filter: 'blur(0.5px)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 mb-6"
          >
            <Sparkles className="h-4 w-4" />
            SGBN
          </motion.div>

          <h1 className="sgbn-hero-title text-[clamp(2.5rem,8vw,5rem)] font-extrabold leading-[1.1] tracking-tight mb-6">
            <span className="text-white">SG </span>
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${GOLD}`}>
              Business Network
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-gray-200 max-w-4xl mx-auto mb-4 leading-relaxed font-semibold">
            Where businesses, freelancers & community grow together
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            A structured business growth network built on trust, referrals, and opportunity
            sharing.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <HeroButton href="#membership">Join SGBN</HeroButton>
            <HeroButton intent="secondary" href="#what-is">
              Learn More
            </HeroButton>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.02)_1px,transparent_2px)] bg-[length:60px_100%] opacity-20 pointer-events-none" />
      </section>

      {/* What Is SGBN */}
      <section id="what-is" className="sgbn-section relative py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Is{" "}
              <span className={`bg-clip-text text-transparent bg-gradient-to-r ${EMERALD}`}>
                SGBN?
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A global business & freelancer networking ecosystem designed to facilitate growth
              through structure, discipline, and mutual support.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 md:p-12">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl bg-gradient-to-br from-emerald-400/20 via-white/10 to-amber-400/20" />
            <div className="relative">
              <Globe className="h-16 w-16 text-emerald-400 mb-6 mx-auto" />
              <p className="text-center text-gray-200 text-lg leading-relaxed">
                SGBN connects businesses and freelancers in a structured, trust-based environment
                where every member contributes to collective growth. Through exclusive chapters,
                strategic referrals, and collaborative opportunities, we're building the future of
                professional networking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="sgbn-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Core Pillars</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The foundation of our structured growth network
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-emerald-400/30 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-500/15 p-3">
                    <pillar.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{pillar.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{pillar.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Types */}
      <section id="membership" className="sgbn-section relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Membership Types</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the membership that fits your business goals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {membershipTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 px-4 py-1 text-xs font-bold text-black">
                      <Award className="h-3 w-3" />
                      POPULAR
                    </span>
                  </div>
                )}

                <div
                  className={`relative overflow-hidden rounded-3xl border ${
                    tier.popular ? "border-amber-400/40" : "border-white/10"
                  } bg-white/5 backdrop-blur-md p-8`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tier.accent} opacity-5`}
                  />

                  <div className="relative">
                    <h3 className="text-2xl font-bold mb-2 text-white">{tier.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span
                        className={`text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${tier.accent}`}
                      >
                        {tier.price}
                      </span>
                      <span className="text-gray-400 text-lg">{tier.period}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-200">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-3 rounded-xl font-semibold text-black bg-gradient-to-r ${tier.accent} hover:brightness-110 transition-all`}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meetings & Participation */}
      <section className="sgbn-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Meetings & Participation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
              <Calendar className="h-10 w-10 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">
                Monthly Chapter Meeting
              </h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                Offline preferred for deeper connections and networking
              </p>
              <p className="text-sm text-gray-400">
                Build lasting relationships with local chapter members
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
              <Globe className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Online Global Session</h3>
              <p className="text-gray-300 leading-relaxed mb-2">
                For founders, freelancers & hiring opportunities
              </p>
              <p className="text-sm text-gray-400">
                Mandatory participation to remain active in the network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring & Investment */}
      <section className="sgbn-section relative py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-black to-black backdrop-blur-md p-8 md:p-12">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-emerald-400/20" />

            <div className="relative">
              <DollarSign className="h-12 w-12 text-emerald-400 mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Hiring & Investment Pledge</h2>

              <div className="space-y-4 text-gray-200">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    <strong className="text-white">30% reinvestment allocation</strong> into
                    ecosystem support
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-amber-400 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    Eligible for <strong className="text-white">Supreme Community Panels</strong>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    Includes{" "}
                    <strong className="text-white">
                      full-time, part-time & freelance sourcing
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why SGBN Stands Out */}
      <section className="sgbn-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why SGBN Stands Out</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyStandOut.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center"
              >
                <item.icon className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
                <p className="text-white font-semibold">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="sgbn-section relative py-24 px-6 pb-32">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Who Benefits</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              SGBN creates value for every member of our ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whoBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.audience}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-white/20 transition-all"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
                />

                <div className="relative">
                  <div
                    className={`mb-4 inline-flex rounded-xl bg-gradient-to-r ${benefit.gradient} p-3 opacity-80`}
                  >
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{benefit.audience}</h3>
                  <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-gray-950 to-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to{" "}
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${EMERALD}`}>
              Transform
            </span>{" "}
            Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join SGBN today and become part of a global network built on trust, collaboration, and
            mutual growth.
          </p>
          <div className="flex justify-center">
            <HeroButton href="#membership">Join SGBN Now</HeroButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
