"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Users,
  MessageCircle,
  Settings,
  Home,
  ChevronRight,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

const navigation: NavigationItem[] = [
  { name: "Home", href: "/", icon: Home },
  { name: "Personas", href: "/personas", icon: Users },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface ResponsiveNavigationProps {
  children: React.ReactNode;
}

export default function ResponsiveNavigation({
  children,
}: ResponsiveNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationWithCurrent = navigation.map((item) => ({
    ...item,
    current: pathname === item.href,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Navigation Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white/10 backdrop-blur-sm border-r border-white/20">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center px-6">
            <h1 className="text-xl font-bold text-white">Digital Persona</h1>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigationWithCurrent.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      item.current
                        ? "bg-purple-500/20 text-purple-200 border border-purple-500/30"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        item.current
                          ? "text-purple-300"
                          : "text-white/70 group-hover:text-white"
                      }`}
                    />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-sm border-r border-white/20 transition-transform duration-300 ease-in-out lg:hidden
      `}
      >
        {/* Mobile Logo and Close Button */}
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-lg font-bold text-white">Digital Persona</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="mt-2 px-2 space-y-1">
          {navigationWithCurrent.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                  item.current
                    ? "bg-purple-500/20 text-purple-200 border border-purple-500/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white active:bg-white/20"
                }`}
              >
                <div className="flex items-center">
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      item.current
                        ? "text-purple-300"
                        : "text-white/70 group-hover:text-white"
                    }`}
                  />
                  {item.name}
                </div>
                <ChevronRight className="h-4 w-4 text-white/40" />
              </a>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 lg:hidden bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="flex h-16 items-center gap-4 px-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-white/70" />
            </button>
            <h1 className="text-lg font-semibold text-white truncate">
              {navigationWithCurrent.find((item) => item.current)?.name ||
                "Digital Persona"}
            </h1>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
