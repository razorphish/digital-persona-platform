"use client";

import React from "react";
import { Wifi, WifiOff, Circle } from "lucide-react";

interface StatusIndicatorProps {
  isConnected: boolean;
  personaStatus?: "online" | "busy" | "responding" | "offline";
  className?: string;
}

const StatusIndicator = React.memo(function StatusIndicator({
  isConnected,
  personaStatus = "offline",
  className = "",
}: StatusIndicatorProps) {
  const connectionIcon = React.useMemo(() => {
    return isConnected ? (
      <Wifi className="h-4 w-4 text-green-400" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-400" />
    );
  }, [isConnected]);

  const personaStatusColor = React.useMemo(() => {
    switch (personaStatus) {
      case "online":
        return "text-green-400";
      case "busy":
        return "text-yellow-400";
      case "responding":
        return "text-blue-400";
      case "offline":
      default:
        return "text-gray-400";
    }
  }, [personaStatus]);

  const personaStatusText = React.useMemo(() => {
    switch (personaStatus) {
      case "online":
        return "Online";
      case "busy":
        return "Busy";
      case "responding":
        return "Responding...";
      case "offline":
      default:
        return "Offline";
    }
  }, [personaStatus]);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {connectionIcon}
        <span className={isConnected ? "text-green-400" : "text-red-400"}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Separator */}
      <span className="text-white/30">•</span>

      {/* Persona Status */}
      <div className="flex items-center gap-1">
        <Circle
          className={`h-2 w-2 ${personaStatusColor} ${
            personaStatus === "responding" ? "animate-pulse" : ""
          }`}
        />
        <span className={personaStatusColor}>{personaStatusText}</span>
      </div>
    </div>
  );
});

export default StatusIndicator;
