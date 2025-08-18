"use client";

import { AuthMiddleware } from "../../components/auth/AuthMiddleware";

/**
 * Layout for protected routes that require authentication.
 * Only routes within the (protected) folder will have AuthMiddleware running.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthMiddleware />
      {children}
    </>
  );
}
