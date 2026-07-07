"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BACKUP_FOOTER, BACKUP_HEADER, BACKUP_STEPS, CARD_APPLY_LABEL, CARD_APPLY_URL } from "@/lib/card-content";
import { CardPhoneMock } from "./card-phone-mock";

const EASE = [0.22, 1, 0.36, 1] as const;

export function CardOnboardingSteps() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div id="card-steps" className="relative mt-14 scroll-mt-24 border-t border-[#E2E8F0] pt-12 sm:mt-16">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C41E3A]">
          {BACKUP_HEADER.label}
        </p>
        <h3 className="mt-3 font-display text-[clamp(1.5rem,4.5vw,2.25rem)] font-black leading-tight tracking-tight text-[#0F172A]">
          {BACKUP_HEADER.title}
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#64748B] sm:text-[15px]">
          {BACKUP_HEADER.desc}
        </p>
      </header>

      <div className="mt-8 flex w-full max-w-xl mx-auto items-center justify-center gap-2 px-2">
        {BACKUP_STEPS.map((step, i) => (
          <button
            key={step.title}
            type="button"
            onClick={() => setActiveStep(i)}
            aria-current={activeStep === i ? "step" : undefined}
            className={`min-h-[44px] flex-1 rounded-full px-2 py-2.5 text-[11px] font-semibold leading-tight transition-colors sm:text-xs ${
              activeStep === i
                ? "bg-[#C41E3A] text-white shadow-[0_8px_24px_rgba(196,30,58,0.25)]"
                : "border border-[#E2E8F0] bg-white text-[#64748B]"
            }`}
          >
            {step.pill}
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#f5f5f7] bg-[url(/backup-scene-bg.png)] bg-cover bg-center p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_20%,rgba(255,255,255,0.92)_0%,rgba(248,249,250,0.5)_50%,transparent_80%)]" />

        <div className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <CardPhoneMock activeStep={activeStep} />

          <div className="relative min-h-[100px] text-center lg:min-h-[120px] lg:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={BACKUP_STEPS[activeStep].title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex flex-col justify-center gap-2"
              >
                <p className="m-0 font-display text-[clamp(1.25rem,4vw,1.75rem)] font-bold tracking-tight text-[#0F172A]">
                  {BACKUP_STEPS[activeStep].title}
                </p>
                <p className="m-0 text-[14px] leading-[1.55] text-[#64748B] sm:text-[15px]">
                  {BACKUP_STEPS[activeStep].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-xl px-4 text-center text-sm leading-relaxed text-[#64748B]">
        {BACKUP_FOOTER}
      </p>

      <div className="mt-8 flex justify-center">
        <a
          href={CARD_APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="global-pay-btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-8 text-sm font-extrabold text-white"
        >
          {CARD_APPLY_LABEL}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
