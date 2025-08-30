"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { trpc } from "@/lib/trpc";

type MessageItem = {
  id: string;
  from: string;
  preview: string;
  time: string;
};

const PAGE_SIZE = 20;

function MessagesContent() {
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Replace mock data with tRPC query
  const {
    data: messages,
    isLoading,
    error,
  } = trpc.messages.getUserMessages.useQuery({
    limit: PAGE_SIZE,
    offset: 0,
  });

  const items = messages || [];

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600">
            Error loading messages: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {items.length === 0 && !isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No messages yet
          </div>
        ) : (
          items.map((m) => (
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
                <div className="text-sm text-gray-600 truncate">
                  {m.preview}
                </div>
              </div>
            </div>
          ))
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
