"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import SyncProfileFab from "@/app/components/SyncProfileFab";
import ChatbotAssistant from "@/app/components/ChatbotAssistant";
import LoginRequiredScreen from "@/app/components/auth/LoginRequiredScreen";
import { useAuth } from "@/app/context/AuthContext";
import { getDashboardData } from "@/actions/user";
import { isPrivateRoute } from "@/lib/auth-routes";
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

const STANDALONE_ROUTES = ["/new-kyc-docs"];

function isShellRoute(pathname: string) {
  return SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isStandaloneRoute(pathname: string) {
  return STANDALONE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { setShellData, hydrated, userName, userRank, avatarUrl, balance } = useShellStore();

  const isPrivate = useMemo(() => isPrivateRoute(pathname), [pathname]);
  const shouldUseShell = useMemo(() => isShellRoute(pathname), [pathname]);
  const shouldUseStandaloneLayout = useMemo(() => isStandaloneRoute(pathname), [pathname]);

  useEffect(() => {
    if (!shouldUseShell || authLoading || !isAuthenticated) return;

    getDashboardData().then((res) => {
      if (res?.error) return;
      setShellData({
        userName: res?.profile?.fullName,
        userRank: res?.performanceRank?.name ?? res?.rank?.name,
        avatarUrl: res?.profile?.profilePicture,
        balance: res?.wallet?.availableBalance,
      });
    });
  }, [shouldUseShell, authLoading, isAuthenticated, pathname, setShellData]);

  if (isPrivate && authLoading && !isAuthenticated) {
    return <div className="min-h-screen bg-[#F8FAFC]" aria-busy="true" aria-label="Loading" />;
  }

  if (isPrivate && !authLoading && !isAuthenticated) {
    return <LoginRequiredScreen />;
  }

  if (shouldUseStandaloneLayout) {
    return <>{children}</>;
  }

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
