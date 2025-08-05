"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
}

export default function MainNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const mainNavItems: NavigationItem[] = [
    {
      name: "Feed",
      href: "/feed",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
      ),
    },
    {
      name: "Personas",
      href: "/personas",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },

    {
      name: "Social",
      href: "/social",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.5 8H17c-.8 0-1.5.7-1.5 1.5v6.5H14v-8c0-1.1-.9-2-2-2s-2 .9-2 2v8H8.5V9.5C8.5 8.7 7.8 8 7 8H5.5c-.8 0-1.5.7-1.5 1.5L1.46 17H4v5h4v-5h1v5h4v-5h1v5h4z" />
        </svg>
      ),
    },
    {
      name: "Learning",
      href: "/learning",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
        </svg>
      ),
    },
  ];

  const profileMenuItems = [
    { name: "Account Settings", href: "/account", icon: "⚙️" },
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Creator Tools", href: "/creator/dashboard", icon: "🛠️" },
    { name: "Analytics", href: "/analytics", icon: "📈" },
    { name: "Monetization", href: "/monetization", icon: "💰" },
    { name: "Safety Center", href: "/safety", icon: "🛡️" },
    { name: "Privacy Settings", href: "/privacy", icon: "🔒" },
    { name: "Files", href: "/files", icon: "📁" },
  ];

  const handleLogout = async () => {
    await logout();
    // No need to redirect here - AuthContext.logout() already handles the redirect
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side - Logo and Main Nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/feed" className="flex items-center">
              <img src="/logo.svg" alt="Hibiji" className="h-8 w-auto" />
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {item.count && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Search and Profile */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search personas, creators..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {/* Messages */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  7
                </span>
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user?.name || "User"}
                        </p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {profileMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="mr-3">🚪</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex items-center justify-around py-2">
            {mainNavItems.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                  isActive(item.href) ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <span className="mb-1">{item.icon}</span>
                <span className="text-xs">{item.name}</span>
                {item.count && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </nav>
  );
}
