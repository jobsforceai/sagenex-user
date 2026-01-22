"use client";

import { useState, useEffect } from 'react';
import { Timer, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

interface CountdownTimerProps {
  deadline: string | null | undefined;
}

const QUALIFICATION_WINDOW_DAYS = 120;

const CountdownTimer = ({ deadline }: CountdownTimerProps) => {
  const calculateTimeLeft = () => {
    if (!deadline) return null;

    const difference = +new Date(deadline) - +new Date();
    if (difference <= 0) return {};

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const calculateProgress = () => {
    if (!deadline) return 0;
    const now = Date.now();
    const end = new Date(deadline).getTime();
    if (Number.isNaN(end)) return 0;
    const start = end - QUALIFICATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (now >= end) return 100;
    if (now <= start) return 0;

    const totalDuration = end - start;
    const elapsedTime = now - start;

    return (elapsedTime / totalDuration) * 100;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [progress, setProgress] = useState(calculateProgress());

  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      setProgress(calculateProgress());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) {
    return null;
  }

  const countdownText = timeLeft && Object.keys(timeLeft).length > 0
    ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    : "Ended";

  return (
    <div className="mt-6 border-t border-neutral-800/50 pt-6">
       <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">Earnings Multiplier Qualification Window</h3>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-gray-800 text-white border-gray-700 p-4 rounded-lg shadow-lg">
                        <h4 className="font-bold text-lg mb-2">How this works:</h4>
                        <p className="text-sm">
                            You have a fixed {QUALIFICATION_WINDOW_DAYS}-day window to qualify for higher multipliers.
                        </p>
                        <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                            <li>3.0x: 6 direct active members + $5,000 team business.</li>
                            <li>4.0x: 12 direct active members + $10,000 team business.</li>
                            <li>If the window ends without qualifying, your multiplier locks at 2.5x.</li>
                        </ul>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">{countdownText}</div>
            { timeLeft && Object.keys(timeLeft).length > 0 ? (
                <>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                            className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.toFixed(1)}% of qualification period passed.</p>
                </>
            ) : (
                <p className="text-sm text-red-500">The qualification period has ended.</p>
            )}
        </div>
    </div>
  );
};

export default CountdownTimer;
