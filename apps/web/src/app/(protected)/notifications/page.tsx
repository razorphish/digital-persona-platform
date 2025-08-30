"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

type NotificationItem = {
  id: string;
  title: string;
  time: string;
  type:
    | "like"
    | "social"
    | "review"
    | "trending"
    | "feed"
    | "monetization"
    | "system"
    | "suggestion"
    | "security";
};

const PAGE_SIZE = 20;

function NotificationsContent() {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Replace mock data with tRPC query
  const {
    data: notifications,
    isLoading,
    error,
  } = trpc.notifications.getUserNotifications.useQuery({
    limit: PAGE_SIZE,
    offset: 0,
  });

  const items = notifications || [];

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600">
            Error loading notifications: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {items.length === 0 && !isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="px-4 py-3 flex items-start gap-3">
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
                <div className="text-sm text-gray-900 truncate">{n.title}</div>
                <div className="text-xs text-gray-500">{n.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
