"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

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

  // Add refs for hover handling
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const notificationsTimeoutRef = useRef<NodeJS.Timeout>();
  const messagesTimeoutRef = useRef<NodeJS.Timeout>();

  // Get real messages from tRPC
  const { data: allMessages = [] } = trpc.messages.getUserMessages.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  // Filter for unread messages only
  const unreadMessages = allMessages.filter((message) => !message.isRead);

  // Enhanced hover handling for notifications
  const handleNotificationsMouseEnter = () => {
    if (notificationsTimeoutRef.current) {
      clearTimeout(notificationsTimeoutRef.current);
    }
    setIsNotificationsOpen(true);
  };

  const handleNotificationsMouseLeave = () => {
    notificationsTimeoutRef.current = setTimeout(() => {
      setIsNotificationsOpen(false);
    }, 150); // Small delay to prevent accidental closing
  };

  // Enhanced hover handling for messages
  const handleMessagesMouseEnter = () => {
    if (messagesTimeoutRef.current) {
      clearTimeout(messagesTimeoutRef.current);
    }
    setIsMessagesOpen(true);
  };

  const handleMessagesMouseLeave = () => {
    messagesTimeoutRef.current = setTimeout(() => {
      setIsMessagesOpen(false);
    }, 150); // Small delay to prevent accidental closing
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (notificationsTimeoutRef.current) {
        clearTimeout(notificationsTimeoutRef.current);
      }
      if (messagesTimeoutRef.current) {
        clearTimeout(messagesTimeoutRef.current);
      }
    };
  }, []);

  // Hide navigation on auth routes and landing page to avoid showing header on login/signout
  const hideOnAuthRoutes = pathname === "/" || pathname.startsWith("/auth/");
  if (hideOnAuthRoutes) {
    return null;
  }

  // Additional safety: Hide if user is not authenticated and on landing page
  if (pathname === "/" && !user) {
    return null;
  }

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

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

    {
      name: "Analytics",
      href: "/analytics",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Creator",
      href: "/creator/dashboard",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
  ];

  const profileMenuItems = [
    { name: "Account Settings", href: "/account", icon: "⚙️" },
    { name: "Billing", href: "/account/billing", icon: "💳" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
    { name: "Creator Dashboard", href: "/creator/dashboard", icon: "🎨" },
    { name: "Monetization", href: "/monetization", icon: "💰" },
    { name: "Help & Support", href: "/help", icon: "❓" },
  ];

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
                ref={messagesRef}
                className="relative"
                onMouseEnter={handleMessagesMouseEnter}
                onMouseLeave={handleMessagesMouseLeave}
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
                    {Math.min(unreadMessages.length, 9)}
                  </span>
                </button>

                {isMessagesOpen && (
                  <div
                    className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    onMouseEnter={handleMessagesMouseEnter}
                    onMouseLeave={handleMessagesMouseLeave}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Unread Messages
                      </h4>
                      <p className="text-xs text-gray-500">
                        {unreadMessages.length} unread message
                        {unreadMessages.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ul className="max-h-96 overflow-auto">
                      {unreadMessages.length === 0 ? (
                        <li className="px-4 py-3 text-center text-gray-500">
                          No unread messages
                        </li>
                      ) : (
                        unreadMessages.slice(0, 8).map((m) => (
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
                        ))
                      )}
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
                ref={notificationsRef}
                className="relative"
                onMouseEnter={handleNotificationsMouseEnter}
                onMouseLeave={handleNotificationsMouseLeave}
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
                    0
                  </span>
                </button>

                {isNotificationsOpen && (
                  <div
                    className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    onMouseEnter={handleNotificationsMouseEnter}
                    onMouseLeave={handleNotificationsMouseLeave}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Notifications
                      </h4>
                      <p className="text-xs text-gray-500">
                        No notifications yet
                      </p>
                    </div>
                    <ul className="max-h-96 overflow-auto">
                      <li className="px-4 py-3 text-center text-gray-500">
                        No notifications yet
                      </li>
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

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen((v) => !v)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {user?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <ul>
                      {profileMenuItems.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <span className="mr-2">🚪</span>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
