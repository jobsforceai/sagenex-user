"use client";

import Image from "next/image";
import React from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import HeroButton from "./hero-button";
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const fireflyCount = 10; // Number of fireflies
const fireflies = Array.from({ length: fireflyCount }, (_, i) => ({
  id: i,
  x: Math.random() * 80 + 10, // Random horizontal position (percentage) - centered
  y: Math.random() * 30 + 50, // Random vertical position (percentage)
  animationDelay: Math.random(), // Random animation delay
  animationDuration: Math.random() * 3 + 2, // Random animation duration between 2 and 5 seconds
}));

export default function HomePage() {
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
  });

  return (
    <div className="h-[150vh] text-white overflow-hidden relative bg-black hero-scene">
      <div className="relative h-screen">
        {/* Text at the top */}
        <div className="absolute top-[35%] -translate-y-1/2 left-0 w-full z-20 flex flex-col items-center justify-center gap-8 h-1/3">
          {" "}
          {/* Added z-20 */}
          <div className="text-[60px] font-semibold flex items-center flex-col">
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
            <HeroButton href="/">Join the revolution</HeroButton>
            <HeroButton intent="secondary" className="w-full" href="/">
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
          {fireflies.map((firefly) => (
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

      {/* Dashboard content here */}
      <div className="absolute dashboard flex items-center justify-center top-[45%] left-1/2 -translate-x-1/2">
        <div className="absolute -top-[6px] bg-gradient-to-r from-transparent via-white to-transparent h-[6px] w-270"></div>
        <div className="box-gradient-border w-270 h-150 bg-black"></div>
      </div>
    </div>
  );
}
