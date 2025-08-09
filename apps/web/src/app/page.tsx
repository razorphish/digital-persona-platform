"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { Footer } from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError, isAuthenticated } = useAuth();

  // If user is already authenticated, direct to dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.svg"
            alt="Hibiji"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back to Hibiji!
          </h1>
          <p className="text-gray-600 mb-6">You are already signed in.</p>
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      await login(email, password);
      // AuthMiddleware will automatically redirect to feed after successful login
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Hibiji" className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <a href="#login-form" className="scroll-smooth">
                <Button variant="ghost">Sign In</Button>
              </a>
              <Link href="/auth/register">
                <Button>Join Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <img
              src="/logo.svg"
              alt="Hibiji"
              className="h-12 w-auto mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Hibiji
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Connect with friends and build your digital persona.
            </p>
            <p className="text-base text-gray-500">
              Join the social platform where AI helps you discover and share
              your authentic self.
            </p>
          </div>

          {/* Login Form */}
          <div
            id="login-form"
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Sign in to Hibiji
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Sign Up Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3 text-center">
              New to Hibiji?
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Join millions of people sharing their stories and building their
              digital personas.
            </p>
            <Link href="/auth/register">
              <Button variant="outline" size="lg" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2h-6l-4 4V8a2 2 0 012-2z"
                  />
                </svg>
              </div>
              <span>AI-powered conversations that understand you</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span>Connect with friends and discover new communities</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span>Privacy-focused with complete control over your data</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
