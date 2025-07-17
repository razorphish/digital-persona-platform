"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  conversationId: string;
}

interface TypingIndicator {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

interface PersonaStatus {
  personaId: string;
  status: "online" | "offline" | "busy" | "responding";
  lastSeen?: string;
}

interface SocketContextType {
  isConnected: boolean;
  sendMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  updatePersonaStatus: (
    personaId: string,
    status: PersonaStatus["status"]
  ) => void;
  messages: Message[];
  typingUsers: TypingIndicator[];
  personaStatuses: Record<string, PersonaStatus>;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
  token?: string;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  token,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [personaStatuses, setPersonaStatuses] = useState<
    Record<string, PersonaStatus>
  >({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl =
        process.env.NODE_ENV === "production"
          ? "wss://your-production-domain.com/ws"
          : "ws://localhost:3001/ws";

      ws.current = new WebSocket(`${wsUrl}?token=${token || ""}`);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.reason);
        setIsConnected(false);

        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          // Auto-reconnect on unexpected closure
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(
              `Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`
            );
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setIsConnected(false);
    }
  };

  const handleMessage = (data: any) => {
    switch (data.type) {
      case "message":
        setMessages((prev) => [...prev, data.payload]);
        break;

      case "typing":
        setTypingUsers((prev) => {
          const filtered = prev.filter(
            (user) =>
              !(
                user.userId === data.payload.userId &&
                user.conversationId === data.payload.conversationId
              )
          );
          if (data.payload.isTyping) {
            return [...filtered, data.payload];
          }
          return filtered;
        });
        break;

      case "personaStatus":
        setPersonaStatuses((prev) => ({
          ...prev,
          [data.payload.personaId]: data.payload,
        }));
        break;

      case "userJoined":
        setOnlineUsers((prev) =>
          Array.from(new Set([...prev, data.payload.userId]))
        );
        break;

      case "userLeft":
        setOnlineUsers((prev) =>
          prev.filter((id) => id !== data.payload.userId)
        );
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const sendData = (type: string, payload: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("WebSocket not connected. Message not sent:", {
        type,
        payload,
      });
    }
  };

  const sendMessage = (message: Omit<Message, "id" | "timestamp">) => {
    sendData("sendMessage", message);
  };

  const joinConversation = (conversationId: string) => {
    sendData("joinConversation", { conversationId });
  };

  const leaveConversation = (conversationId: string) => {
    sendData("leaveConversation", { conversationId });
  };

  const startTyping = (conversationId: string) => {
    sendData("startTyping", { conversationId });
  };

  const stopTyping = (conversationId: string) => {
    sendData("stopTyping", { conversationId });
  };

  const updatePersonaStatus = (
    personaId: string,
    status: PersonaStatus["status"]
  ) => {
    sendData("updatePersonaStatus", { personaId, status });
  };

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close(1000, "Component unmounting");
      }
    };
  }, [token]);

  const value: SocketContextType = {
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    updatePersonaStatus,
    messages,
    typingUsers,
    personaStatuses,
    onlineUsers,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
