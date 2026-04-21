"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

interface User {
  userId: string;
  fullName: string;
  email: string;
  hasPasswordSet?: boolean;
  role?: "nominee";
  isImpersonated?: boolean;
  impersonatedByAdminId?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
  bootstrapImpersonationSession: (token: string, userData?: { userId: string; fullName: string; email: string }) => Promise<{ error?: string }>;
  replaceSession: (data: { token: string; user: User | null }, redirectPath?: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
  showSetPasswordModal: boolean;
  onPasswordSet: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const router = useRouter();

  const persistSession = (authToken: string, authUser: User | null) => {
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    Cookies.set("authToken", authToken, { secure: isSecure, sameSite: isSecure ? "none" : "lax" });
    if (authUser) {
      localStorage.setItem("user", JSON.stringify(authUser));
    } else {
      localStorage.removeItem("user");
    }
    setToken(authToken);
    setUser(authUser);
  };

  const fetchProfileWithToken = async (authToken: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const responseText = await res.text();
    let responseData: User | { message?: string; error?: string };
    try {
      responseData = JSON.parse(responseText);
    } catch {
      return { error: "The server returned an invalid profile response." };
    }

    if (!res.ok) {
      return {
        error:
          (typeof (responseData as { error?: string }).error === "string" &&
            (responseData as { error?: string }).error) ||
          (responseData as { message?: string }).message ||
          "Failed to load user profile.",
      };
    }

    return responseData as User;
  };

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const storedToken = Cookies.get("authToken");
        const storedUser = localStorage.getItem("user");
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setToken(storedToken);
          setUser(parsedUser);

          const profile = await fetchProfileWithToken(storedToken);
          if (!("error" in profile)) {
            localStorage.setItem("user", JSON.stringify(profile));
            setUser(profile);
          }
        } else if (!storedToken && storedUser) {
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Failed to access storage", error);
      } finally {
        setLoading(false);
      }
    };

    hydrateAuth();
  }, []);

  const login = (data: { token: string; user: User }) => {
    const { token, user } = data;
    persistSession(token, user);

    if (user.hasPasswordSet === false) {
      setShowSetPasswordModal(true);
    }
    
    router.push("/dashboard");
  };

  const replaceSession = (
    data: { token: string; user: User | null },
    redirectPath?: string
  ) => {
    persistSession(data.token, data.user);
    if (redirectPath) {
      router.replace(redirectPath);
    }
  };

  const bootstrapImpersonationSession = async (
    authToken: string,
    userData?: { userId: string; fullName: string; email: string }
  ) => {
    if (userData) {
      persistSession(authToken, { ...userData, isImpersonated: true });
      return {};
    }
    const profile = await fetchProfileWithToken(authToken);
    if ("error" in profile) {
      return { error: profile.error };
    }
    persistSession(authToken, profile);
    return {};
  };

  const logout = () => {
    Cookies.remove("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const onPasswordSet = () => {
    const updatedUser = user ? { ...user, hasPasswordSet: true } : null;
    if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    setShowSetPasswordModal(false);
  };

  const isAuthenticated = !loading && !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        bootstrapImpersonationSession,
        replaceSession,
        isAuthenticated,
        loading,
        showSetPasswordModal,
        onPasswordSet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
