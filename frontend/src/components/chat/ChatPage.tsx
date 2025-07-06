import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Send, Loader2 } from "lucide-react";
import { Message, Conversation, Persona } from "../../types";
import apiService from "../../services/api";
import toast from "react-hot-toast";

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversationData = useCallback(async () => {
    try {
      const [conversationData, messagesData] = await Promise.all([
        apiService.getConversation(parseInt(id!)),
        apiService.getMessages(parseInt(id!)),
      ]);

      setConversation(conversationData);
      setMessages(messagesData);

      // Fetch persona data
      try {
        const personas = await apiService.getPersonas();
        const conversationPersona = personas.find(
          (p) => p.id === conversationData.persona_id
        );
        setPersona(conversationPersona || null);
      } catch (error) {
        console.error("Failed to fetch persona:", error);
      }
    } catch (error) {
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchConversationData();
    }
  }, [id, fetchConversationData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    const messageToSend = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const response = await apiService.sendMessage(parseInt(id), {
        content: messageToSend,
      });

      // Add the new messages to the conversation
      setMessages((prev) => [
        ...prev,
        response.user_message,
        response.assistant_message,
      ]);
      toast.success("Message sent successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send message");
      setNewMessage(messageToSend); // Restore the message if it failed
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Conversation not found
        </h2>
        <p className="text-gray-600">
          The conversation you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {conversation.title}
            </h1>
            {persona && (
              <p className="text-sm text-gray-600">
                Chatting with {persona.name} ({persona.relation_type})
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600">
              Send your first message to begin chatting with{" "}
              {persona?.name || "your persona"}.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`chat-message ${
                  message.role === "user" ? "user" : "assistant"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <span>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                      {message.tokens_used && (
                        <span>• {message.tokens_used} tokens</span>
                      )}
                      {message.response_time_ms && (
                        <span>• {message.response_time_ms}ms</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${persona?.name || "your persona"}...`}
            className="flex-1 input-field"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="btn-primary flex items-center px-6"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
