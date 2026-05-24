"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import SyncProfileFab from "@/app/components/SyncProfileFab";
import ChatbotAssistant from "@/app/components/ChatbotAssistant";
import { getDashboardData } from "@/actions/user";
import { useShellStore } from "@/store/shellStore";

const SHELL_ROUTES = [
  "/dashboard",
  "/wallet",
  "/team",
  "/team-business",
  "/rewards",
  "/payouts",
  "/salary",
  "/sgnx-gold",
  "/fancy-ids",
  "/courses",
  "/kyc",
  "/profile",
];

function isShellRoute(pathname: string) {
  return SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setShellData, hydrated, userName, userRank, avatarUrl, balance } = useShellStore();

  const shouldUseShell = useMemo(() => isShellRoute(pathname), [pathname]);

  useEffect(() => {
    if (!shouldUseShell) return;

    // Fetch sidebar identity/balance context once and refresh on shell route changes.
    getDashboardData().then((res) => {
      if (res?.error) return;
      setShellData({
        userName: res?.profile?.fullName,
        userRank: res?.performanceRank?.name ?? res?.rank?.name,
        avatarUrl: res?.profile?.profilePicture,
        balance: res?.wallet?.availableBalance,
      });
    });
  }, [shouldUseShell, pathname, setShellData]);

  if (!shouldUseShell) {
    return (
      <>
        {children}
        <SyncProfileFab />
        <ChatbotAssistant />
      </>
    );
  }

  return (
    <>
      <AppShell
        balance={hydrated ? balance : undefined}
        userName={hydrated ? userName : undefined}
        userRank={hydrated ? userRank : undefined}
        avatarUrl={hydrated ? avatarUrl : undefined}
      >
        {children}
      </AppShell>
      <SyncProfileFab />
        <ChatbotAssistant />
    </>
  );
}
