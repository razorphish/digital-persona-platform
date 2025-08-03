import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../components/providers/TRPCProvider";
import { AuthProvider } from "../contexts/AuthContext";
import { AuthMiddleware } from "../components/auth/AuthMiddleware";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hibiji - AI-Powered Digital Persona Platform",
  description:
    "Create and manage your digital personas with AI-powered conversations and social media integration",
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
            {children}
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
