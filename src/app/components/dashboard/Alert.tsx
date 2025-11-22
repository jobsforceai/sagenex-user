// components/dashboard/Alert.tsx
"use client";

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

type AlertProps = {
  message: string;
  type: 'warning' | 'danger';
};

export default function Alert({ message, type }: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const baseClasses = "p-4 rounded-lg flex items-start gap-4 mb-6 border";
  const typeClasses = {
    warning: "bg-yellow-900/50 border-yellow-700 text-yellow-300",
    danger: "bg-red-900/50 border-red-700 text-red-300",
  };

  return (
    <div className={clsx(baseClasses, typeClasses[type])}>
      <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5" />
      <div className="flex-grow">
        <p className="font-semibold">{type === 'warning' ? 'Salary Warning' : 'Salary Paused'}</p>
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={() => setIsVisible(false)} className="p-1 rounded-md hover:bg-white/10">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
