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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  // Hide navigation on auth routes and landing page to avoid showing header on login/signout
  const hideOnAuthRoutes = pathname === "/" || pathname.startsWith("/auth/");
  if (hideOnAuthRoutes) {
    return null;
  }

  const DEFAULT_RECENT_NOTIFICATIONS = 8; // can be overridden via admin later
  const notifications = [
    {
      id: "n1",
      title: "New follower on your persona",
      time: "2m ago",
      type: "social" as const,
    },
    {
      id: "n2",
      title: "Your persona was liked",
      time: "10m ago",
      type: "like" as const,
    },
    {
      id: "n3",
      title: "New review received",
      time: "23m ago",
      type: "review" as const,
    },
    {
      id: "n4",
      title: "Trending boost: +12%",
      time: "1h ago",
      type: "trending" as const,
    },
    {
      id: "n5",
      title: "Recommendation added to feed",
      time: "3h ago",
      type: "feed" as const,
    },
    {
      id: "n6",
      title: "Subscription inquiry",
      time: "5h ago",
      type: "monetization" as const,
    },
    {
      id: "n7",
      title: "System message updated",
      time: "Yesterday",
      type: "system" as const,
    },
    {
      id: "n8",
      title: "New persona suggestion",
      time: "Yesterday",
      type: "suggestion" as const,
    },
    {
      id: "n9",
      title: "Two-factor login from Chrome",
      time: "2d ago",
      type: "security" as const,
    },
  ];

  const DEFAULT_RECENT_MESSAGES = 8; // configurable later
  const messages = [
    {
      id: "m1",
      from: "Airica",
      preview: "Here’s your daily insight…",
      time: "2m ago",
    },
    {
      id: "m2",
      from: "Alex J.",
      preview: "Thanks for the collab!",
      time: "12m ago",
    },
    {
      id: "m3",
      from: "System",
      preview: "Your export is ready.",
      time: "34m ago",
    },
    {
      id: "m4",
      from: "Support",
      preview: "We’ve updated your ticket.",
      time: "1h ago",
    },
    {
      id: "m5",
      from: "Marcus R.",
      preview: "Let’s chat tomorrow.",
      time: "3h ago",
    },
    {
      id: "m6",
      from: "Airica",
      preview: "New suggestion for you.",
      time: "5h ago",
    },
    {
      id: "m7",
      from: "Sarah K.",
      preview: "Loved your persona!",
      time: "Yesterday",
    },
    { id: "m8", from: "Billing", preview: "Invoice paid.", time: "2d ago" },
  ];

  const mainNavItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
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
              <div
                className="relative"
                onMouseEnter={() => setIsMessagesOpen(true)}
                onMouseLeave={() => setIsMessagesOpen(false)}
              >
                <button
                  onClick={() => setIsMessagesOpen((v) => !v)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Math.min(messages.length, 9)}
                  </span>
                </button>

                {isMessagesOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Messages
                      </h4>
                      <p className="text-xs text-gray-500">
                        Showing latest {DEFAULT_RECENT_MESSAGES}
                      </p>
                    </div>
                    <ul className="max-h-96 overflow-auto">
                      {messages.slice(0, DEFAULT_RECENT_MESSAGES).map((m) => (
                        <li
                          key={m.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
                              {m.from.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {m.from}
                                </div>
                                <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {m.time}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                {m.preview}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="px-4 py-2 border-t border-gray-100 text-right">
                      <a
                        href="/messages"
                        onClick={() => setIsMessagesOpen(false)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        See All →
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div
                className="relative"
                onMouseEnter={() => setIsNotificationsOpen(true)}
                onMouseLeave={() => setIsNotificationsOpen(false)}
              >
                <button
                  onClick={() => setIsNotificationsOpen((v) => !v)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Math.min(notifications.length, 9)}
                  </span>
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h4>
                      <p className="text-xs text-gray-500">
                        Showing latest {DEFAULT_RECENT_NOTIFICATIONS}
                      </p>
                    </div>
                    <ul className="max-h-96 overflow-auto">
                      {notifications
                        .slice(0, DEFAULT_RECENT_NOTIFICATIONS)
                        .map((n) => (
                          <li
                            key={n.id}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                          >
                            <span className="text-lg">
                              {n.type === "like" && "👍"}
                              {n.type === "social" && "👥"}
                              {n.type === "review" && "📝"}
                              {n.type === "trending" && "🔥"}
                              {n.type === "feed" && "✨"}
                              {n.type === "monetization" && "💰"}
                              {n.type === "system" && "🔔"}
                              {n.type === "suggestion" && "💡"}
                              {n.type === "security" && "🛡️"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate">
                                {n.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {n.time}
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                    <div className="px-4 py-2 border-t border-gray-100 text-right">
                      <a
                        href="/notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        See All →
                      </a>
                    </div>
                  </div>
                )}
              </div>
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
