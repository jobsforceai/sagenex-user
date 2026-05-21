import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import AuthenticatedShell from "@/app/components/AuthenticatedShell";
import PostHogProvider from "./posthog-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Sagenex | Heritage & Innovation",
  description: "Sagenex is a diversified global ecosystem combining business networking, technology, capital deployment, and community-driven growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${inter.variable} ${bricolage.variable}`}>
      <body>
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <PostHogProvider>
            <AuthProvider>
            <NextThemesProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <AuthenticatedShell>{children}</AuthenticatedShell>
              <Toaster />
            </NextThemesProvider>
          </AuthProvider>
          </PostHogProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
