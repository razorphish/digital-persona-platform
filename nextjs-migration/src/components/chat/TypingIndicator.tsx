"use client";

import React from "react";
import { Bot } from "lucide-react";

interface TypingIndicatorProps {
  typingUsers: string[];
  isVisible: boolean;
}

const TypingIndicator = React.memo(function TypingIndicator({
  typingUsers,
  isVisible,
}: TypingIndicatorProps) {
  if (!isVisible || typingUsers.length === 0) {
    return null;
  }

  const typingText = React.useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    } else {
      return `${typingUsers[0]} and ${
        typingUsers.length - 1
      } others are typing...`;
    }
  }, [typingUsers]);

  return (
    <div className="flex items-start gap-3 lg:gap-4 animate-pulse">
      <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Bot className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
      </div>

      <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg p-3 lg:p-4 max-w-[85%] lg:max-w-xs xl:max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-sm lg:text-base text-white/70">
            {typingText}
          </span>

          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
