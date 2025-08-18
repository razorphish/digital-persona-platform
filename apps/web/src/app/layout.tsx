import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../components/providers/TRPCProvider";
import { AuthProvider } from "../contexts/AuthContext";
import ConditionalNavigation from "../components/navigation/ConditionalNavigation";

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
            <ConditionalNavigation />
            {children}
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
