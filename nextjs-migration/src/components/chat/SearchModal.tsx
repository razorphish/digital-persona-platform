"use client";

import { useState, useEffect } from "react";
import { X, Search, Filter, Calendar, User, MessageCircle } from "lucide-react";
import { Conversation, ChatMessage } from "@/types/chat";
import { Persona } from "@/types/personas";

interface SearchModalProps {
  conversations: Conversation[];
  personas: Persona[];
  onClose: () => void;
  onConversationSelected: (conversation: Conversation) => void;
}

interface SearchResult {
  conversation: Conversation;
  persona?: Persona;
  matchedMessages: ChatMessage[];
  totalMessages: number;
}

export default function SearchModal({
  conversations,
  personas,
  onClose,
  onConversationSelected,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(
    null
  );
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">(
    "all"
  );
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [allMessages, setAllMessages] = useState<Record<number, ChatMessage[]>>(
    {}
  );

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [query, selectedPersonaId, dateRange]);

  const fetchAllMessages = async () => {
    const messageMap: Record<number, ChatMessage[]> = {};

    for (const conversation of conversations) {
      try {
        const response = await fetch(
          `/api/chat/conversations/${conversation.id}/messages`
        );
        if (response.ok) {
          const messages = await response.json();
          messageMap[conversation.id] = messages;
        }
      } catch (error) {
        console.error(
          `Failed to fetch messages for conversation ${conversation.id}:`,
          error
        );
      }
    }

    setAllMessages(messageMap);
  };

  useEffect(() => {
    fetchAllMessages();
  }, [conversations]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const results: SearchResult[] = [];
      const searchTerm = query.toLowerCase();

      for (const conversation of conversations) {
        // Apply persona filter
        if (
          selectedPersonaId &&
          conversation.persona_id !== selectedPersonaId
        ) {
          continue;
        }

        // Apply date filter
        if (dateRange !== "all") {
          const conversationDate = new Date(conversation.created_at);
          const now = new Date();
          const daysDiff =
            (now.getTime() - conversationDate.getTime()) / (1000 * 3600 * 24);

          if (
            (dateRange === "week" && daysDiff > 7) ||
            (dateRange === "month" && daysDiff > 30) ||
            (dateRange === "year" && daysDiff > 365)
          ) {
            continue;
          }
        }

        const persona = personas.find((p) => p.id === conversation.persona_id);
        const conversationMessages = allMessages[conversation.id] || [];

        // Search in conversation title
        const titleMatch = conversation.title
          .toLowerCase()
          .includes(searchTerm);

        // Search in persona name
        const personaMatch = persona?.name.toLowerCase().includes(searchTerm);

        // Search in messages
        const matchedMessages = conversationMessages.filter((message) =>
          message.content.toLowerCase().includes(searchTerm)
        );

        // Include conversation if there's any match
        if (titleMatch || personaMatch || matchedMessages.length > 0) {
          results.push({
            conversation,
            persona,
            matchedMessages,
            totalMessages: conversationMessages.length,
          });
        }
      }

      // Sort by relevance (number of matched messages, then by recency)
      results.sort((a, b) => {
        const scoreA = a.matchedMessages.length;
        const scoreB = b.matchedMessages.length;
        if (scoreA !== scoreB) return scoreB - scoreA;

        return (
          new Date(b.conversation.updated_at).getTime() -
          new Date(a.conversation.updated_at).getTime()
        );
      });

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-yellow-400/30 text-yellow-200 px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-white/20 w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Search Conversations
              </h2>
              <p className="text-white/70 text-sm">
                Find messages and conversations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* Search Controls */}
        <div className="p-6 border-b border-white/20 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
            <input
              type="text"
              placeholder="Search messages, conversation titles, or persona names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Persona Filter */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-white/60" />
              <select
                value={selectedPersonaId || ""}
                onChange={(e) =>
                  setSelectedPersonaId(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Personas</option>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/60" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : query.trim() === "" ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">
                Enter a search term to find conversations and messages
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/70">No results found for "{query}"</p>
              <p className="text-white/50 text-sm mt-2">
                Try different keywords or adjust filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-white/70 text-sm mb-4">
                Found {searchResults.length} conversation
                {searchResults.length !== 1 ? "s" : ""}
              </p>

              {searchResults.map((result) => (
                <div
                  key={result.conversation.id}
                  onClick={() => onConversationSelected(result.conversation)}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-4 border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">
                        {highlightText(result.conversation.title, query)}
                      </h3>
                      <p className="text-white/60 text-sm">
                        with{" "}
                        {result.persona
                          ? highlightText(result.persona.name, query)
                          : "Unknown Persona"}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(
                          result.conversation.updated_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <MessageCircle className="h-3 w-3" />
                      {result.matchedMessages.length}/{result.totalMessages}{" "}
                      messages
                    </div>
                  </div>

                  {/* Matched Messages Preview */}
                  {result.matchedMessages.length > 0 && (
                    <div className="space-y-2">
                      {result.matchedMessages.slice(0, 2).map((message) => (
                        <div
                          key={message.id}
                          className="bg-black/20 rounded p-3 border-l-2 border-blue-400/50"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-white/60">
                              {message.role === "user"
                                ? "You"
                                : result.persona?.name}
                            </span>
                            <span className="text-xs text-white/40">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm">
                            {highlightText(
                              message.content.length > 150
                                ? message.content.substring(0, 150) + "..."
                                : message.content,
                              query
                            )}
                          </p>
                        </div>
                      ))}
                      {result.matchedMessages.length > 2 && (
                        <p className="text-white/50 text-xs">
                          +{result.matchedMessages.length - 2} more matching
                          messages
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
