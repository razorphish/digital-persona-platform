import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../components/providers/TRPCProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { AuthMiddleware } from "../components/auth/AuthMiddleware";
import ConditionalNavigation from "../components/navigation/ConditionalNavigation";
import ConditionalFooter from "../components/navigation/ConditionalFooter";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevents font flash and improves loading
  preload: true,
});

export const metadata: Metadata = {
  title: "Hibiji - Connect, Share, and Build Your Digital Persona",
  description:
    "Join Hibiji, the social platform where you connect with friends and build your AI-powered digital persona through conversations and shared experiences.",
  keywords: "social media, digital persona, AI, social network, connect, share",
  openGraph: {
    title: "Hibiji - Connect, Share, and Build Your Digital Persona",
    description:
      "Join Hibiji, the social platform where you connect with friends and build your AI-powered digital persona.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  other: {
    // Aggressive cache busting for refresh issue debugging
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0',
    'pragma': 'no-cache',
    'expires': '0',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <AuthProvider>
            <AuthMiddleware />
            <ConditionalNavigation />
            <main className="min-h-screen flex flex-col">
              {children}
            </main>
            <ConditionalFooter />
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
