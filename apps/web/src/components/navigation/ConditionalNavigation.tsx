"use client";

import { usePathname } from "next/navigation";
import MainNavigation from "./MainNavigation";

const HIDE_NAV_PREFIXES = [
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/auth/signout",
];

export default function ConditionalNavigation() {
  const pathname = usePathname() || "/";

  const shouldHide =
    pathname === "/" ||
    HIDE_NAV_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Hide global navigation on auth and landing pages only
  if (shouldHide) return null;

  return <MainNavigation />;
}
