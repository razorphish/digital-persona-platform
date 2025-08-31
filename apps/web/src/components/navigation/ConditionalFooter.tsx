"use client";

import { usePathname } from "next/navigation";
import { Footer } from "../Footer";

const HIDE_FOOTER_PREFIXES = [
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/auth/signout",
];

export default function ConditionalFooter() {
  const pathname = usePathname() || "/";

  const shouldHide =
    pathname === "/" ||
    HIDE_FOOTER_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Hide footer on auth and landing pages only (same as navigation)
  if (shouldHide) return null;

  return <Footer />;
}
