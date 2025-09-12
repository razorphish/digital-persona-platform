"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainNavigation from "./MainNavigation";

const HIDE_NAV_PREFIXES = [
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/auth/signout",
];

export default function ConditionalNavigation() {
  const pathname = usePathname() || "/";
  const { isAuthenticated, isLoading } = useAuth();

  const shouldHide =
    pathname === "/" ||
    HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Hide global navigation on auth and landing pages only
  if (shouldHide) return null;

  // Don't show navigation while authentication is loading
  if (isLoading) return null;

  // Don't show navigation if user is not authenticated (they'll be redirected)
  if (!isAuthenticated) return null;

  return <MainNavigation />;
}
