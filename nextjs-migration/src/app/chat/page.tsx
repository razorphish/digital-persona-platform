"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Download,
  Filter,
  Send,
  User,
  Bot,
  MoreVertical,
  Archive,
  Trash2,
  Wifi,
  WifiOff,
  Circle,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { Conversation, ChatMessage } from "@/types/chat";
import { Persona } from "@/types/personas";
import CreateConversationModal from "@/components/chat/CreateConversationModal";
import ExportConversationModal from "@/components/chat/ExportConversationModal";
import SearchModal from "@/components/chat/SearchModal";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import StatusIndicator from "@/components/chat/StatusIndicator";
import { useSocket } from "@/contexts/SocketContext";
import LayoutWrapper from "@/components/LayoutWrapper";

function ChatPageContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Real-time WebSocket functionality
  const {
    isConnected,
    sendMessage: sendRealtimeMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    messages: realtimeMessages,
    typingUsers,
    personaStatuses,
    onlineUsers,
  } = useSocket();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle real-time messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      const newMessage = realtimeMessages[realtimeMessages.length - 1];
      if (
        selectedConversation &&
        newMessage.conversationId === selectedConversation.id.toString()
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id: parseInt(newMessage.id),
            content: newMessage.content,
            role: "user",
            created_at: newMessage.timestamp,
            conversation_id: parseInt(newMessage.conversationId),
          } as ChatMessage,
        ]);
      }
    }
  }, [realtimeMessages, selectedConversation]);

  // Join/leave conversations for real-time updates
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation.id.toString());
      return () => {
        leaveConversation(selectedConversation.id.toString());
      };
    }
  }, [selectedConversation, joinConversation, leaveConversation]);

  // Handle typing indicators
  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (selectedConversation && value.trim()) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(selectedConversation.id.toString());
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(selectedConversation.id.toString());
      }, 1000);
    } else if (isTyping) {
      setIsTyping(false);
      if (selectedConversation) {
        stopTyping(selectedConversation.id.toString());
      }
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [conversationsRes, personasRes] = await Promise.all([
        fetch("/api/chat/conversations"),
        fetch("/api/personas"),
      ]);

      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json();
        setConversations(conversationsData);
        if (conversationsData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsData[0]);
        }
      }

      if (personasRes.ok) {
        const personasData = await personasRes.json();
        setPersonas(personasData);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`
      );
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    const userMessage = messageInput.trim();
    setMessageInput("");
    setSendingMessage(true);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping(selectedConversation.id.toString());
    }

    // Send real-time message immediately for instant UI feedback
    const tempMessage = {
      content: userMessage,
      sender: "user",
      conversationId: selectedConversation.id.toString(),
    };
    sendRealtimeMessage(tempMessage);

    try {
      const response = await fetch(
        `/api/chat/conversations/${selectedConversation.id}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: userMessage }),
        }
      );

      if (response.ok) {
        const chatResponse = await response.json();
        setMessages((prev) => [
          ...prev,
          chatResponse.user_message,
          chatResponse.assistant_message,
        ]);

        // Send assistant message via WebSocket too
        const assistantMessage = {
          content: chatResponse.assistant_message.content,
          sender: "assistant",
          conversationId: selectedConversation.id.toString(),
        };
        sendRealtimeMessage(assistantMessage);

        // Update conversation list to reflect new activity
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation.id
              ? { ...conv, updated_at: new Date().toISOString() }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const persona = personas.find((p) => p.id === conv.persona_id);
    return (
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getPersonaForConversation = (personaId: number) => {
    return personas.find((p) => p.id === personaId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex h-screen relative">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Conversations List */}
        <div
          className={`
          ${
            isMobileSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          fixed lg:relative z-50 lg:z-auto
          w-80 lg:w-80 
          h-full lg:h-auto
          bg-white/10 backdrop-blur-sm border-r border-white/20 
          flex flex-col
          transition-transform duration-300 ease-in-out
        `}
        >
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-white">
                Conversations
              </h2>
              <div className="flex items-center gap-2">
                {/* Mobile close button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5 text-white/70" />
                </button>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Search conversations"
                >
                  <Search className="h-4 w-4 text-white/70" />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="New conversation"
                >
                  <Plus className="h-4 w-4 text-white/70" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/70">No conversations found</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const persona = getPersonaForConversation(
                  conversation.persona_id
                );
                const isSelected = selectedConversation?.id === conversation.id;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      // Close sidebar on mobile after selection
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`p-3 lg:p-4 border-b border-white/10 cursor-pointer transition-colors touch-manipulation ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500/30"
                        : "hover:bg-white/5 active:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate text-sm lg:text-base">
                          {conversation.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs lg:text-sm text-white/60 truncate">
                            with {persona?.name || "Unknown Persona"}
                          </p>
                          {persona &&
                            personaStatuses[persona.id.toString()] && (
                              <div className="flex items-center gap-1">
                                <Circle
                                  className={`h-2 w-2 ${
                                    personaStatuses[persona.id.toString()]
                                      .status === "online"
                                      ? "text-green-400 fill-green-400"
                                      : personaStatuses[persona.id.toString()]
                                          .status === "busy"
                                      ? "text-yellow-400 fill-yellow-400"
                                      : personaStatuses[persona.id.toString()]
                                          .status === "responding"
                                      ? "text-blue-400 fill-blue-400 animate-pulse"
                                      : "text-gray-400 fill-gray-400"
                                  }`}
                                />
                                <span className="text-xs text-white/40">
                                  {
                                    personaStatuses[persona.id.toString()]
                                      .status
                                  }
                                </span>
                              </div>
                            )}
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(
                            conversation.updated_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConversation(conversation);
                            setShowExportModal(true);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Export conversation"
                        >
                          <Download className="h-3 w-3 text-white/60" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              {/* Mobile Header - Only visible on mobile */}
              <div className="lg:hidden p-4 border-b border-white/20 bg-white/5 flex items-center gap-4">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Open sidebar"
                >
                  <Menu className="h-5 w-5 text-white/70" />
                </button>
                <h1 className="text-lg font-semibold text-white truncate">
                  {selectedConversation.title}
                </h1>
              </div>

              {/* Chat Header - Desktop */}
              <div className="hidden lg:block p-6 border-b border-white/20 bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {selectedConversation.title}
                    </h1>
                    <p className="text-white/70">
                      Chatting with{" "}
                      {
                        getPersonaForConversation(
                          selectedConversation.persona_id
                        )?.name
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-3 lg:space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      persona={getPersonaForConversation(
                        selectedConversation.persona_id
                      )}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing Indicators */}
              <div className="px-3 lg:px-6">
                <TypingIndicator
                  typingUsers={typingUsers
                    .filter(
                      (user) =>
                        user.conversationId ===
                        selectedConversation.id.toString()
                    )
                    .map((user) => user.username)}
                  isVisible={
                    typingUsers.filter(
                      (user) =>
                        user.conversationId ===
                        selectedConversation.id.toString()
                    ).length > 0
                  }
                />
              </div>

              {/* Message Input */}
              <div className="p-3 lg:p-6 border-t border-white/20 bg-white/5">
                {/* Connection Status */}
                <div className="flex items-center justify-between mb-3">
                  <StatusIndicator
                    isConnected={isConnected}
                    personaStatus={
                      selectedConversation &&
                      personaStatuses[
                        selectedConversation.persona_id.toString()
                      ]
                        ? personaStatuses[
                            selectedConversation.persona_id.toString()
                          ].status
                        : "offline"
                    }
                  />
                  {onlineUsers.length > 0 && (
                    <div className="text-xs lg:text-sm text-white/60">
                      {onlineUsers.length} online
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-2 lg:gap-4">
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={messageInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm lg:text-base"
                      style={{ minHeight: "44px", maxHeight: "120px" }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={
                      !messageInput.trim() || sendingMessage || !isConnected
                    }
                    className="px-3 lg:px-6 py-2 lg:py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-1 lg:gap-2 text-sm lg:text-base min-h-[44px]"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {sendingMessage ? "Sending..." : "Send"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md mx-auto">
                {/* Mobile Header with Menu Button */}
                <div className="lg:hidden mb-8">
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Menu className="h-5 w-5 text-white/70" />
                    <span className="text-white/70">View Conversations</span>
                  </button>
                </div>

                <h2 className="text-xl lg:text-2xl font-bold text-white mb-4">
                  Welcome to Chat
                </h2>
                <p className="text-white/70 mb-6 text-sm lg:text-base">
                  <span className="hidden lg:inline">
                    Select a conversation from the sidebar or create a new one
                  </span>
                  <span className="lg:hidden">
                    Choose a conversation or start a new one
                  </span>
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 lg:px-6 py-2 lg:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto text-sm lg:text-base"
                >
                  <Plus className="h-4 w-4" />
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateConversationModal
          personas={personas}
          onClose={() => setShowCreateModal(false)}
          onConversationCreated={(conversation) => {
            setConversations((prev) => [conversation, ...prev]);
            setSelectedConversation(conversation);
            setShowCreateModal(false);
          }}
        />
      )}

      {showExportModal && selectedConversation && (
        <ExportConversationModal
          conversation={selectedConversation}
          messages={messages}
          persona={getPersonaForConversation(selectedConversation.persona_id)}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showSearchModal && (
        <SearchModal
          conversations={conversations}
          personas={personas}
          onClose={() => setShowSearchModal(false)}
          onConversationSelected={(conversation) => {
            setSelectedConversation(conversation);
            setShowSearchModal(false);
          }}
        />
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <LayoutWrapper>
      <ChatPageContent />
    </LayoutWrapper>
  );
}
