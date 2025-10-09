"use client";

import Link from "next/link";
import { VariantProps, cva } from "class-variance-authority";

const button = cva(
  [
    "text-white",
    "font-bold",
    "py-2",
    "px-4",
    "rounded-full",
    "cursor-pointer",
    "transition-all",
    "duration-300",
    "shadow-white",
  ],
  {
    variants: {
      intent: {
        primary:
          "bg-[#00562E] shadow-[inset_2px_2px_8px_0px_rgba(255,_255,_255,_0.05)] hover:shadow-[inset_2px_2px_16px_0px_rgba(255,_255,_255,_0.05)]",
        secondary:
          "bg-[#0B3621] gradient-border",
      },

      size: {
        small: "text-sm px-2 py-1",
        medium: "text-base px-4 py-2",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "medium",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  children: React.ReactNode;
  href: string;
}
export default function HeroButton({ children, href, intent, size }: ButtonProps) {
  return (
    <Link href={href}>
      <button className={button({ intent, size })}>{children}</button>
    </Link>
  );
}