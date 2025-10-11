"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Home, DollarSign, FileText, CreditCard, Users, User as LucideUser, Clock, BarChart2 } from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import HeroButton from "../ui/hero-button";
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const fireflyCount = 10; // Number of fireflies

type Firefly = { id: number; x: number; y: number; animationDelay: number; animationDuration: number };

export default function HomePage() {
  const [fireflies, setFireflies] = useState<Firefly[] | null>(null);

  useEffect(() => {
    // generate fireflies only on client to avoid hydration mismatches
    const arr: Firefly[] = Array.from({ length: fireflyCount }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 30 + 50,
      animationDelay: Math.random(),
      animationDuration: Math.random() * 3 + 2,
    }));
    setFireflies(arr);
  }, []);
  useGSAP(() => {
    // const split = SplitText.create(".hero-heading", {
    //   type: "lines",
    //   mask: "lines",
    //   linesClass: "line++",
    // });

    const tl = gsap.timeline();
    tl.fromTo(
      ".dashboard",
      {
        y: 100,
        opacity: 0,
        ease: "power1.in",
        duration: 0.4,
      },
      {
        y: 0,
        opacity: 1,
      }
    )
      .fromTo(
        ".blob",
        {
          height: 0,
          top: "70%",
          ease: "back",
          duration: 0.6,
          delay: 0.2,
        },
        {
          height: 1200,
          top: "60%",
        }
      )
      .fromTo(
        ".sec-text",
        {
          y: -100,
          opacity: 0,
          ease: "power1.in",
          duration: 0.4,
        },
        {
          y: 0,
          opacity: 1,
          delay: 0.4,
        }
      )
      .from(".hero-heading", {
        opacity: 0,
        rotate: -10,
        y: -120,
        ease: "back",
        duration: 0.6,
        stagger: 0.2,
      })
      .fromTo(
        ".spotlight",
        {
          y: -100,
          opacity: 0,
          ease: "back",
          duration: 0.4,
        },
        {
          y: 0,
          opacity: 1,
        }
      )
      .to(
        ".fireflies",
        {
          opacity: 1,
          ease: "back",
          duration: 0.4,
        },
        "<"
      );

    // ScrollTrigger-driven entrance for the dashboard subcomponents
    // comp1 -> translate from left
    gsap.fromTo(".comp1", {
      x: 0,
    }, {
      x: -55,
      y: -45,
      scale: 1.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".dashboard",
        start: "top 75%",
        end: "top 60%",
        scrub: 0.6,
      },
    });

    // comp2 -> translate fromTo top
    gsap.fromTo(".comp2", {
      x: 0,
    }, {
      x: -55,
      y: 60,
      scale: 1.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".dashboard",
        start: "top 75%",
        end: "top 60%",
        scrub: 0.6,
      },
    });

    // comp3 -> translate fromTo top
    gsap.fromTo(".comp3", {
      x: 0,

    }, {
      x: 25,
      y: -45,
      scale: 1.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".dashboard",
        start: "top 75%",
        end: "top 60%",
        scrub: 0.6,
      },
    });

    // comp4 -> translate fromTo bottom
    gsap.fromTo(".comp4", {
      x: 0,
    }, {
      x: 25,
      y: 14,
      scale: 1.1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".dashboard",
        start: "top 75%",
        end: "top 60%",
        scrub: 0.6,
      },
    });

    // comp4 -> translate fromTo bottom
    gsap.fromTo(".comp5", {
      x: 0,
    }, {
      x: 4,
      y: 30,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".dashboard",
        start: "top 75%",
        end: "top 60%",
        scrub: 0.6,
      },
    });
  });

  return (
    <div className="h-screen sm:h-[150vh] text-white overflow-hidden relative bg-black hero-scene">
      <div className="relative h-screen">
        {/* Text at the top */}
        <div className="absolute top-[35%] -translate-y-1/2 left-0 w-full z-20 flex flex-col items-center justify-center gap-8 h-1/3">
          {" "}
          {/* Added z-20 */}
          <div className="text-[40px] md:text-[60px] font-semibold flex items-center flex-col">
            <h1 className="hero-heading bg-clip-text text-center leading-17 text-transparent bg-gradient-to-r from-[#98d5c5] via-[#f5f5f5] to-[#98d5c5]">
              Innovation. Trust. Growth.
            </h1>
            <h1 className="hero-heading bg-clip-text text-center leading-17 text-transparent bg-gradient-to-r from-[#98d5c5] via-[#f5f5f5] to-[#98d5c5]">
              Powering the Future of crypto
            </h1>
          </div>
          <div className="sec-text">
            <p className="bg-clip-text text-lg text-transparent bg-gradient-to-r from-[#98d5c5] via-[#f5f5f5] to-[#98d5c5]">
              Where Artificial Intelligence Meets Financial Precision.
            </p>
          </div>
          <div className="sec-text flex gap-8">
            <HeroButton href="/login">Join the revolution</HeroButton>
            <HeroButton intent="secondary" className="w-full" href="#academy">
              Explore packages
            </HeroButton>
          </div>
        </div>

        {/* circular glow effect  */}
        <div className="blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 aspect-square backdrop-blur-[250px] bg-radial from-[#00ffa284] to-black"></div>

        {/* Spotlight Icon */}
        <div className="spotlight opacity-0 absolute top-0 right-1/12 -rotate-10 z-10">
          <Image src="/light.svg" alt="Light Icon" width={550} height={550} />
        </div>

        {/* Fireflies */}
        <div className="fireflies opacity-0 absolute -top-20 right-1/6 w-80 h-80 flex justify-center pointer-events-none z-[5]">
          {" "}
          {/* Increased container height and removed justify-around*/}
          {fireflies?.map((firefly) => (
            <div
              key={firefly.id}
              className="firefly"
              style={{
                left: `${firefly.x}%`,
                top: `${firefly.y}%`,
                animationDelay: `${firefly.animationDelay}s`,
                animationDuration: `${firefly.animationDuration}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="absolute block sm:hidden dashboard top-[70%] left-1/2 p-7 -translate-x-1/2 w-[1100px] max-w-[95%] bg-black/90 border-3 rounded-3xl">
        <div className="absolute -top-[3px] bg-gradient-to-r from-transparent via-white to-transparent h-[6px] w-[1100px] max-w-[95%]"></div>
        <Image
            src="/dasboard.png"
            alt="Dashboard"
            width={1080}
            height={1080}
            className="w-full h-full rounded-2xl"
          />
      </div>

      {/* Dashboard content here */}
      <div className="absolute hidden sm:block dashboard top-[45%] left-1/2 p-7 -translate-x-1/2 w-[1100px] max-w-[95%] h-160 bg-black/90 border-6 rounded-3xl">
        <div className="absolute -top-[6px] bg-gradient-to-r from-transparent via-white to-transparent h-[6px] w-[1100px] max-w-[95%]"></div>

        <div className="flex w-full h-full items-center gap-6">
          {/* Sidebar (separate) */}
          <aside className="relative h-full flex flex-col justify-between">
            <nav className="comp1 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-md shadow-md">
              <ul className="space-y-2">
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                    <Home className="h-5 w-5 text-[#d4b36a]" /> <span>Dashboard</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                    <DollarSign className="h-5 w-5 text-[#d4b36a]" /> <span>Payouts</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                    <FileText className="h-5 w-5 text-[#d4b36a]" /> <span>KYC</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                    <CreditCard className="h-5 w-5 text-[#d4b36a]" /> <span>Wallet</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                    <Users className="h-5 w-5 text-[#d4b36a]" /> <span>My Team</span>
                  </div>
                </li>

              </ul>
            </nav>

            <div className="comp2 rounded-2xl border border-white/8 bg-white/5 p-3 backdrop-blur-md shadow-md">
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90">
                <LucideUser className="h-5 w-5 text-[#d4b36a]" /> <span>Profile</span>
              </div>
            </div>
          </aside>

          {/* Main dashboard area */}
          <main className="relative w-full">
            {/* User card (separate) */}
            <div className="comp3 w-full">
              <div className="rounded-2xl border border-white/12 bg-white/5 p-4 backdrop-blur-md shadow-md flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#f5e7b0] to-[#d4b36a] flex items-center justify-center text-black font-bold">JS</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">John Smith</div>
                      <div className="text-xs text-white/75">Level: <span className="font-semibold text-[#d4b36a]">Builder</span></div>
                    </div>
                    <div className="text-xs text-white/60">Rank #42</div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-white/75 mb-1">Progress to next level</div>
                    <div className="w-full rounded-full bg-white/10 h-2">
                      <div className="rounded-full bg-gradient-to-r from-[#d4b36a] to-[#f5e7b0] h-2" style={{ width: '62%' }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
                      <div>62%</div>
                      <div>Next in: <span className="font-semibold">3 levels</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="mt-3 rounded-2xl border border-white/12 bg-white/5 p-3 backdrop-blur-md shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[#d4b36a]" />
                  <div className="text-sm font-semibold text-white">Time to next level</div>
                </div>
                <CountdownDisplay />
              </div>
            </div>

            {/* Dashboard cards/content */}
            <div className="comp4 mt-3 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-sm text-white/75">Total Earnings</div>
                  <div className="mt-2 text-2xl font-bold text-[#d4b36a]">$12,450</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-sm text-white/75">Pending Payouts</div>
                  <div className="mt-2 text-2xl font-bold text-white">$1,200</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-sm text-white/75">Team Volume</div>
                  <div className="mt-2 text-2xl font-bold text-white">$98,700</div>
                </div>
              </div>

              <div className="comp5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/85 font-semibold">Earnings (Last 30 days)</div>
                    <div className="text-xs text-white/70 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-[#d4b36a]" /> View</div>
                  </div>
                  <div className="mt-3 h-48 bg-gradient-to-b from-white/5 to-transparent rounded-md flex items-end gap-1 p-3">
                    {/* simple sparkline bars */}
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className="flex-1 mx-0.5" style={{ height: `${20 + Math.round(Math.sin(i / 2) * 40 + 40)}%` }}>
                        <div className="h-full rounded-md bg-gradient-to-t from-emerald-400 to-emerald-200" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="text-sm text-white/85 font-semibold">Team Activity</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-white/3 p-3">
                      <div className="text-xs text-white/70">Active Members</div>
                      <div className="text-lg font-bold text-white">1,234</div>
                    </div>
                    <div className="rounded-md bg-white/3 p-3">
                      <div className="text-xs text-white/70">New Signups</div>
                      <div className="text-lg font-bold text-white">87</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-white/75">Recent:</div>
                  <ul className="mt-2 space-y-2 text-sm text-white/80">
                    <li>+ John D. purchased package $1,000</li>
                    <li>+ Maria S. reached Level II</li>
                    <li>+ Payout processed for Sarah K.</li>
                  </ul>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function CountdownDisplay() {
  const [remaining, setRemaining] = useState(3 * 24 * 60 * 60); // 3 days in seconds sample

  useEffect(() => {
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;

  return (
    <div className="text-sm font-semibold text-[#d4b36a] tabular-nums">{String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
  );
}
