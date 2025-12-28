"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "@/app/components/Navbar";
import Footer from "@/components/landing/footer";
import HeroButton from "@/components/ui/hero-button";
import {
  TrendingUp,
  Shield,
  DollarSign,
  Eye,
  Layers,
  Scale,
  CheckCircle,
  FileCheck,
  Target,
  ArrowRight,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  Building2,
  BadgeCheck,
  AlertCircle,
  LineChart,
} from "lucide-react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GOLD = "from-[#FCE79A] via-[#F5C04E] to-[#B67E20]";
const BLUE = "from-blue-400 via-blue-500 to-blue-600";
const PURPLE = "from-purple-400 via-purple-500 to-purple-600";

type Framework = {
  layer: string;
  purpose: string;
  icon: React.ElementType;
  gradient: string;
};

type Stage = {
  stage: string;
  flow: string;
  icon: React.ElementType;
};

type Benefit = {
  title: string;
  icon: React.ElementType;
};

const coreFramework: Framework[] = [
  {
    layer: "Brand Credibility",
    purpose: "Due diligence & structural review",
    icon: BadgeCheck,
    gradient: "from-blue-400 to-cyan-600",
  },
  {
    layer: "Ecosystem Visibility",
    purpose: "Community awareness + market exposure",
    icon: Eye,
    gradient: "from-purple-400 to-pink-600",
  },
  {
    layer: "Strategic Capital",
    purpose: "Deployment for scale, not speculation",
    icon: DollarSign,
    gradient: "from-emerald-400 to-green-600",
  },
];

const governancePoints = [
  { text: "No guaranteed or fixed returns", icon: Shield },
  { text: "Participation performance-based", icon: Target },
  { text: "Capital diversified", icon: Layers },
  { text: "Earnings capped at (3%, 5%, 7%, 10%)", icon: LineChart },
  { text: "Periodic compliance checks", icon: FileCheck },
];

const communityResponsibility = [
  { text: "Governance-first approach", icon: Scale },
  { text: "Transparency standards", icon: Eye },
  { text: "Long-term value prioritization over extraction", icon: TrendingUp },
];

const ideaFlow: Stage[] = [
  {
    stage: "SGBN Verification",
    flow: "Idea clarity & structuring",
    icon: CheckCircle,
  },
  {
    stage: "Submission",
    flow: "Business plan + goals",
    icon: FileCheck,
  },
  {
    stage: "Review & Structuring",
    flow: "Viability, scalability, alignment",
    icon: Scale,
  },
  {
    stage: "Ecosystem Listing",
    flow: "Approval into SGSE",
    icon: BadgeCheck,
  },
  {
    stage: "Execution",
    flow: "Capital, hiring, expansion",
    icon: TrendingUp,
  },
];

const participationModel = [
  "Review & Structuring",
  "Participation",
  "Execution & Scaling",
  "Value Circulation",
];

const longTermBenefits: Benefit[] = [
  { title: "Skill & internships for children", icon: GraduationCap },
  { title: "Mentorship & leadership pathways", icon: Users },
  { title: "Career prioritization in supported businesses", icon: Briefcase },
  { title: "Entrepreneurial mindset training", icon: Sparkles },
];

export default function SGSEPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero animation
      gsap.fromTo(
        ".sgse-hero-title",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".sgse-hero-title",
            start: "top 85%",
          },
        }
      );

      // Section animations
      gsap.utils.toArray(".sgse-section").forEach((section: any) => {
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
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px]" />
        </div>

        {/* Large circular glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 sm:opacity-70 w-[1000px] h-[1000px] aspect-square bg-[radial-gradient(circle,rgba(59,130,246,0.4)_0%,rgba(147,51,234,0.2)_50%,rgba(0,0,0,0)_70%)]" />

        {/* Spotlight effect */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[conic-gradient(from_200deg_at_50%_0%,rgba(147,51,234,.3),rgba(147,51,234,0)_55%)] blur-3xl" />
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-blue-300/80"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite`,
                boxShadow: '0 0 4px rgba(147, 197, 253, 0.8)',
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 mb-6"
          >
            <TrendingUp className="h-4 w-4" />
            SGSE
          </motion.div>

          <h1 className="sgse-hero-title text-[clamp(2.5rem,8vw,5rem)] font-extrabold leading-[1.1] tracking-tight mb-6">
            <span className="text-white">SG </span>
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${BLUE}`}>
              Stocks Exchange
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-gray-200 max-w-4xl mx-auto mb-4 leading-relaxed font-semibold">
            Business Growth, Credibility & Ecosystem Capital
          </p>

          <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto mb-10 leading-relaxed">
            SGSE is the credibility & growth layer of the ecosystem — designed to support
            businesses beyond traditional networking.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <HeroButton href="#framework">Explore Framework</HeroButton>
            <HeroButton intent="secondary" href="#idea-flow">
              Learn the Process
            </HeroButton>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,rgba(255,255,255,.02)_1px,transparent_2px)] bg-[length:60px_100%] opacity-20 pointer-events-none" />
      </section>

      {/* Core Framework */}
      <section id="framework" className="sgse-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Core Framework</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Three strategic layers powering sustainable business growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreFramework.map((item, index) => (
              <motion.div
                key={item.layer}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 hover:border-white/20 transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
                />

                <div className="relative">
                  <div
                    className={`mb-6 inline-flex rounded-2xl bg-gradient-to-r ${item.gradient} p-4 opacity-80`}
                  >
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{item.layer}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.purpose}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance, Risk & Safety */}
      <section className="sgse-section relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-black to-black backdrop-blur-md p-8 md:p-12">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl bg-amber-400/20" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-12 w-12 text-amber-400" />
                <h2 className="text-3xl md:text-4xl font-bold">Governance, Risk & Safety</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {governancePoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 rounded-xl bg-white/5 p-4"
                  >
                    <point.icon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-200">{point.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Responsibility */}
      <section className="sgse-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Community Responsibility</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built on principles that ensure long-term ecosystem health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {communityResponsibility.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center"
              >
                <item.icon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-white font-semibold leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Idea Flow → Growth Path */}
      <section id="idea-flow" className="sgse-section relative py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Idea Flow → Growth Path
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From concept to execution: your journey through SGSE
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/50 via-purple-400/50 to-emerald-400/50" />

            <div className="space-y-8">
              {ideaFlow.map((stage, index) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="flex-1">
                    <div
                      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 ${
                        index % 2 === 0 ? "lg:text-right" : "lg:text-left"
                      }`}
                    >
                      <h3 className="text-xl font-bold mb-2 text-white">{stage.stage}</h3>
                      <p className="text-gray-300">{stage.flow}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 relative z-10">
                    <div className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-4 shadow-lg shadow-blue-500/30">
                      <stage.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Participation Model */}
      <section className="sgse-section relative py-24 px-6 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Participation Model</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A structured approach to ecosystem engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {participationModel.map((stage, index) => (
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 text-center">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-white font-semibold mt-2">{stage}</p>
                </div>
                {index < participationModel.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-blue-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Long-Term Benefits */}
      <section className="sgse-section relative py-24 px-6 pb-32">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Long-Term Benefits</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Building generational value for families and communities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {longTermBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:border-emerald-400/30 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative text-center">
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-500/15 p-3">
                    <benefit.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-white font-semibold leading-relaxed">{benefit.title}</p>
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
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${BLUE}`}>
              Scale
            </span>{" "}
            Your Business?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join SGSE and gain access to strategic capital, ecosystem visibility, and credibility
            that drives sustainable growth.
          </p>
          <div className="flex justify-center">
            <HeroButton href="#framework">Get Started with SGSE</HeroButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
