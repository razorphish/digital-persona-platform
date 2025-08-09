"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";

type MessageItem = {
  id: string;
  from: string;
  preview: string;
  time: string;
};

const PAGE_SIZE = 20;

function MessagesContent() {
  const [items, setItems] = useState<MessageItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const generateBatch = (offset: number, limit: number): MessageItem[] => {
    return Array.from({ length: limit }).map((_, idx) => {
      const idNum = offset + idx + 1;
      const names = [
        "Airica",
        "Alex Johnson",
        "Support",
        "System",
        "Maria L.",
        "Billing",
        "Team",
        "Ops",
      ];
      return {
        id: `msg_${idNum}`,
        from: names[idNum % names.length],
        preview: `Sample message #${idNum} preview text…`,
        time: `${Math.max(1, idNum % 59)}m ago`,
      };
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const batch = generateBatch(page * PAGE_SIZE, PAGE_SIZE);
    setItems((prev) => [...prev, ...batch]);
    setPage(nextPage);
    if (nextPage >= 5) setHasMore(false);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {items.map((m) => (
          <div key={m.id} className="px-4 py-3 flex items-start gap-3">
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
              <div className="text-sm text-gray-600 truncate">{m.preview}</div>
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

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesContent />
    </AuthGuard>
  );
}
