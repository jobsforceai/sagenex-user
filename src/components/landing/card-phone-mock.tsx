"use client";

import { CARD_ONBOARDING_STEPS } from "@/lib/card-content";

type ScreenVariant = "signup" | "kyc" | "card";

const SCREEN_VARIANTS: ScreenVariant[] = ["signup", "kyc", "card"];

const SCREENS: { title: string; subtitle?: string; variant: ScreenVariant }[] = CARD_ONBOARDING_STEPS.map((step, index) => ({
  title: step.title,
  subtitle: step.desc,
  variant: SCREEN_VARIANTS[index] ?? "signup",
}));

const SCREEN_HINTS = [
  {
    label: "Sign up",
    progress: "67%",
  },
  {
    label: "Upload ID & selfie",
    progress: "67%",
  },
  {
    label: "Activated",
    progress: "100%",
  },
] as const;

function SignupScreen() {
  return (
    <div className="flex w-full flex-col gap-2.5 px-1">
      <div className="h-7 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-[10px] leading-7 text-[#94A3B8]">
        you@email.com
      </div>
      <div className="h-7 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 text-[10px] leading-7 text-[#94A3B8]">
        ••••••••
      </div>
      <div className="mt-1 h-8 rounded-lg bg-[#C41E3A] text-center text-[10px] font-medium leading-8 text-white">
        {SCREEN_HINTS[0].label}
      </div>
    </div>
  );
}

function KycScreen() {
  return (
    <div className="flex w-full flex-col items-center gap-2.5 px-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#C41E3A]/40 bg-[#FFF1F4]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="2" width="16" height="20" rx="2" stroke="#C41E3A" strokeWidth="1.5" />
          <circle cx="12" cy="10" r="3" stroke="#C41E3A" strokeWidth="1.5" />
          <path d="M7 18c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="m-0 text-center text-[9px] leading-[1.4] text-[#64748B]">{SCREEN_HINTS[1].label}</p>
      <div className="flex w-full items-center gap-1.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
          <div className="h-full w-2/3 rounded-full bg-[#C41E3A]" />
        </div>
        <span className="text-[9px] font-medium text-[#C41E3A]">{SCREEN_HINTS[1].progress}</span>
      </div>
    </div>
  );
}

function CardScreen() {
  return (
    <div className="flex w-full flex-col items-center gap-2 px-1">
      <div className="relative h-[52px] w-[82px] overflow-hidden rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
        <p className="absolute top-1.5 left-1.5 m-0 text-[5px] font-bold tracking-wider text-white/90">SAGENEX</p>
        <div className="absolute right-1 bottom-1 h-2.5 w-5 rounded-sm bg-[#1a1f71]" />
      </div>
      <p className="m-0 text-center text-[9px] font-medium text-[#C41E3A]">✓ {SCREEN_HINTS[2].label}</p>
    </div>
  );
}

export function CardPhoneMock({ activeStep }: { activeStep: number }) {
  const screen = SCREENS[activeStep] ?? SCREENS[0];

  return (
    <div className="relative mx-auto w-[min(220px,72vw)] sm:w-[240px]" aria-hidden>
      <div className="relative flex aspect-[9/19] flex-col overflow-hidden rounded-[28px] border-[3px] border-[#E2E8F0] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.1)]">
        <div className="absolute left-1/2 top-0 z-10 h-[18px] w-[42%] -translate-x-1/2 rounded-b-[12px] bg-black">
          <span className="absolute left-1/2 top-1/2 h-[3px] w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f1f1f]" />
          <span className="absolute right-2.5 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full bg-[#1f1f1f]" />
        </div>

        <div className="flex items-center justify-between px-4 pt-[7px] text-[9px] font-semibold text-[#0F172A]">
          <span>9:41</span>
          <span className="flex items-center gap-1 opacity-70">
            <span className="ml-0.5 flex h-[7px] w-[13px] items-center rounded-[2px] border border-current px-[1px]">
              <span className="h-[3.5px] w-full rounded-[1px] bg-current" />
            </span>
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
          <p className="m-0 text-center text-[13px] font-semibold text-[#0F172A]">{screen.title}</p>
          {screen.subtitle && (
            <p className="m-0 text-center text-[10px] leading-[1.4] text-[#64748B]">{screen.subtitle}</p>
          )}
          <div className="mt-2 w-full">
            {screen.variant === "signup" && <SignupScreen />}
            {screen.variant === "kyc" && <KycScreen />}
            {screen.variant === "card" && <CardScreen />}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          {SCREENS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeStep ? "w-4 bg-[#C41E3A]" : "w-1.5 bg-[#E2E8F0]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
