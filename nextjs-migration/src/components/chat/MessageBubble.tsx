"use client";

import React from "react";
import { User, Bot } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { Persona } from "@/types/personas";

interface MessageBubbleProps {
  message: ChatMessage;
  persona?: Persona;
  isOptimistic?: boolean;
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  persona,
  isOptimistic = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-3 lg:gap-4 ${
        isUser ? "justify-end" : "justify-start"
      } ${isOptimistic ? "opacity-60" : ""}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
        </div>
      )}

      <div
        className={`max-w-[85%] lg:max-w-xs xl:max-w-md rounded-lg p-3 lg:p-4 ${
          isUser
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
        }`}
      >
        <p className="text-sm lg:text-base leading-relaxed">
          {message.content}
        </p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
          <span className="text-xs text-white/60">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>

          {message.tokens_used && (
            <span className="text-xs text-white/40">
              {message.tokens_used} tokens
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
