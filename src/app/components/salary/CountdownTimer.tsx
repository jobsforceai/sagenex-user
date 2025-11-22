"use client";

import { useState, useEffect } from 'react';


interface CountdownTimerProps {
  expiryTimestamp: string;
  payoutAmount: number;
}

const calculateTimeLeft = (expiryTimestamp: string) => {
  const difference = +new Date(expiryTimestamp) - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
};

const CountdownTimer = ({ expiryTimestamp, payoutAmount }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiryTimestamp));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(expiryTimestamp));
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="text-center">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <p className="text-neutral-400 text-sm">Next Payout Amount</p>
          <p className="text-3xl font-bold text-white">
            {payoutAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timerComponents.map((component, index) => (
            <div key={index} className="flex flex-col items-center justify-center bg-neutral-800 p-3 rounded-lg w-20">
              <span className="text-3xl font-bold text-white">{String(component.value).padStart(2, '0')}</span>
              <span className="text-xs text-neutral-400">{component.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
