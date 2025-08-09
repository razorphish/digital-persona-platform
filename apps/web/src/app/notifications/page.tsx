"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

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
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Mock generator; replace with API later
  const generateBatch = (offset: number, limit: number): NotificationItem[] => {
    return Array.from({ length: limit }).map((_, idx) => {
      const idNum = offset + idx + 1;
      const types: NotificationItem["type"][] = [
        "like",
        "social",
        "review",
        "trending",
        "feed",
        "monetization",
        "system",
        "suggestion",
        "security",
      ];
      return {
        id: `notif_${idNum}`,
        title: `Notification #${idNum}`,
        time: `${Math.max(1, idNum % 59)}m ago`,
        type: types[idNum % types.length],
      };
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const batch = generateBatch(page * PAGE_SIZE, PAGE_SIZE);
    setItems((prev) => [...prev, ...batch]);
    setPage(nextPage);
    if (nextPage >= 5) setHasMore(false); // mock cap
  };

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore) {
        loadMore();
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loaderRef.current]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {items.map((n) => (
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
        ))}
        {hasMore && (
          <div
            ref={loaderRef}
            className="px-4 py-3 text-center text-sm text-gray-500"
          >
            Loading more...
          </div>
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
