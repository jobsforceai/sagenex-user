"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <section className="hero-crimson-stage relative h-screen w-full overflow-hidden pt-20 sm:pt-24">
      <div aria-hidden className="hero-crimson-bg absolute inset-0" />
      <div aria-hidden className="hero-vignette absolute inset-0" />

      <div className="relative z-10 mx-auto h-full w-full max-w-[1320px] px-6 pb-6 sm:px-10 sm:pb-8 lg:px-16 pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hero-watermark pointer-events-none select-none pt-1 text-center sm:pt-2"
        >
          SAGENEX
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.16 }}
          className="absolute left-1/2 top-[59%] z-20 w-fit -translate-x-1/2 -translate-y-1/2"
        >
          <Image
            src="/sagenex.png"
            alt="Sagenex emblem"
            width={560}
            height={560}
            priority
            className="hero-emblem h-auto"
            style={{ width: "clamp(210px, 49vh, 460px)" }}
          />
        </motion.div>

        <div className="absolute inset-x-0 bottom-28 z-20 px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,32vw)_minmax(0,1fr)] lg:items-start">
            <motion.p
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="max-w-[340px] text-sm font-medium leading-tight text-white/92 lg:justify-self-end"
            >
              A Civilization of
              <br />
              Heritage and Innovation
            </motion.p>

            <div className="hidden lg:block" aria-hidden />

            <motion.p
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.38 }}
              className="hidden max-w-[340px] text-sm font-semibold leading-relaxed text-white/95 lg:block"
            >
              At Sagenex, we are more than a team and more than a family. Every campaign we create, every message we share, and every milestone we achieve is built on trust and belief that together we are unstoppable.
            </motion.p>
          </div>
        </div>

      </div>
    </section>
  );
}
