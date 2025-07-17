"use client";

import React from "react";
import { SocketProvider } from "@/contexts/SocketContext";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  // In a real application, you would get the token from your auth system
  // For now, we'll simulate it or leave it undefined for demo purposes
  const [token, setToken] = React.useState<string | undefined>();

  React.useEffect(() => {
    // Try to get token from localStorage or your auth system
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return <SocketProvider token={token}>{children}</SocketProvider>;
}
