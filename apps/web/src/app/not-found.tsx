"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Handle trailing slash redirects for static export
    if (pathname && !pathname.endsWith('/') && pathname !== '/') {
      const withTrailingSlash = pathname + '/';
      console.log(`Redirecting from ${pathname} to ${withTrailingSlash}`);
      router.replace(withTrailingSlash);
      return;
    }
  }, [pathname, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back Home
          </Link>
          <br />
          <Link
            href="/auth/login"
            className="inline-block text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Try Login Page
          </Link>
        </div>
      </div>
    </div>
  );
}