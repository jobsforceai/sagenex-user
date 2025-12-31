"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  userId: string;
  fullName: string;
  email: string;
  hasPasswordSet?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
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

  useEffect(() => {
    try {
      const storedToken = Cookies.get("authToken");
      const storedUser = localStorage.getItem("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (!storedToken && storedUser) {
        localStorage.removeItem("user");
      }
    } catch (error) {
      console.error("Failed to access storage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (data: { token: string; user: User }) => {
    const { token, user } = data;
    Cookies.set("authToken", token, { secure: true, sameSite: "strict" });
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);

    if (user.hasPasswordSet === false) {
      setShowSetPasswordModal(true);
    }
    
    router.push("/dashboard");
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
