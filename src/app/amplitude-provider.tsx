"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAmplitude, trackAmplitude } from "@/lib/amplitude";

export default function AmplitudeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    void initAmplitude();
  }, []);

  useEffect(() => {
    if (!pathname) return;

    trackAmplitude("Page Viewed", {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname]);

  return <>{children}</>;
}
