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
  joinDate: string | null | undefined;
}

const CountdownTimer = ({ deadline, joinDate }: CountdownTimerProps) => {
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
    if (!deadline || !joinDate) return 0;
    const now = new Date().getTime();
    const start = new Date(joinDate).getTime();
    const end = new Date(deadline).getTime();
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
  }, [deadline, joinDate]);

  if (!deadline) {
    return null;
  }

  const countdownText = timeLeft && Object.keys(timeLeft).length > 0
    ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    : "Ended";

  return (
    <div className="mt-6 border-t border-neutral-800/50 pt-6">
       <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-gray-400">4.0x Earnings Multiplier Countdown</h3>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-gray-800 text-white border-gray-700 p-4 rounded-lg shadow-lg">
                        <h4 className="font-bold text-lg mb-2">How this works:</h4>
                        <p className="text-sm">
                            To unlock the 4.0x earnings multiplier, you must sponsor at least 6 users who invest within 60 days of your registration.
                        </p>
                        <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                            <li>New users have a 60-day countdown from their join date.</li>
                            <li>Existing users with expired or nearly expired timers have been granted a 2-week extension.</li>
                            <li>If you have any questions, please contact support.</li>
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