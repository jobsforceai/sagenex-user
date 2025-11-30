"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import React, { useRef } from "react";
import { ExternalLink } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroButton from "../ui/hero-button";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type EcosystemSite = {
  name: string;
  description: string;
  url: string;
  image: string;
  gradient: string;
};

const ecosystemSites: EcosystemSite[] = [
  {
    name: "SGChain",
    description: "Experience the power of blockchain technology with SGChain - our revolutionary decentralized platform built for speed, security, and scalability.",
    url: "https://sgchain.sgxmeta.ai",
    image: "/sgchain.png",
    gradient: "from-purple-400/20 via-blue-400/20 to-indigo-400/20",
  },
  {
    name: "SG5Traders",
    description: "Trade with confidence on SG5Traders - your gateway to advanced crypto trading tools, real-time market insights, and secure wallet management.",
    url: "https://sg5traders.sgxmeta.ai",
    image: "/sg5trader.png",
    gradient: "from-emerald-500/20 via-teal-500/20 to-green-500/20",
  },
];

export default function EcosystemSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Heading animation
    gsap.fromTo(
      ".ecosystem-heading",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".ecosystem-heading",
          start: "top 85%",
          end: "top 65%",
          scrub: 1,
        },
      }
    );

    // Cards stagger animation
    gsap.fromTo(
      ".ecosystem-card",
      {
        opacity: 0,
        y: 80,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".ecosystem-grid",
          start: "top 80%",
          end: "top 50%",
          scrub: 1,
        },
      }
    );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-black text-white py-20 md:py-32 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="ecosystem-heading text-center mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#98d5c5] via-[#f5f5f5] to-[#98d5c5]">
              Our Ecosystem
            </h2>
            <p className="text-lg md:text-xl text-white/75 max-w-3xl mx-auto">
              Explore our innovative platforms designed to revolutionize your blockchain and trading experience
            </p>
          </motion.div>
        </div>

        {/* Cards Grid */}
        <div className="ecosystem-grid grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {ecosystemSites.map((site, index) => (
            <div
              key={site.name}
              className="ecosystem-card group relative"
            >
              {/* Card Container */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:bg-white/10">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${site.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Image Preview */}
                <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                  <Image
                    src={site.image}
                    alt={`${site.name} Platform Preview`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                {/* Content */}
                <div className="relative p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
                    {site.name}
                  </h3>
                  <p className="text-white/75 mb-6 leading-relaxed">
                    {site.description}
                  </p>

                  {/* Button */}
                  <HeroButton 
                    href={site.url}
                    className="inline-flex items-center gap-2"
                  >
                    <span>Visit {site.name}</span>
                    <ExternalLink className="h-4 w-4" />
                  </HeroButton>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Floating glow effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${site.gradient.replace(/\/20/g, '/30')} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10`} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
