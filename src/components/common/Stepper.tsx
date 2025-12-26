/**
 * Generic Stepper Component
 */

'use client';

import { ReactNode } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
}: StepperProps) {
  return (
    <div className="w-full">
      {/* Horizontal Stepper */}
      <div className="flex items-center justify-between gap-2 mb-8">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              onClick={() => onStepClick?.(idx)}
              disabled={idx > currentStep}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                idx < currentStep || completedSteps.includes(idx)
                  ? 'bg-emerald-500 text-white'
                  : idx === currentStep
                  ? 'bg-emerald-400 text-white ring-2 ring-emerald-300'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {idx < currentStep || completedSteps.includes(idx) ? (
                <Check className="w-5 h-5" />
              ) : (
                idx + 1
              )}
            </button>

            {/* Step Label */}
            <div className="flex-1 ml-3">
              <p
                className={`text-sm font-medium ${
                  idx <= currentStep ? 'text-white' : 'text-white/50'
                }`}
              >
                {step}
              </p>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div
                className={`w-1/2 h-1 mx-2 transition-all ${
                  idx < currentStep ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

interface StepContentProps {
  isActive: boolean;
  children: ReactNode;
}

export function StepContent({ isActive, children }: StepContentProps) {
  if (!isActive) return null;

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
}
