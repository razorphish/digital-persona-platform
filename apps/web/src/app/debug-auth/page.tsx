"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthUtils } from "@/lib/auth";

export default function DebugAuthPage() {
  const { user, isLoading, isAuthenticated, isInitialized, checkAuthState } =
    useAuth();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>(
    {}
  );
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const refreshDebugData = () => {
    if (typeof window !== "undefined") {
      // Get all localStorage data
      const storageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storageData[key] = localStorage.getItem(key);
        }
      }
      setLocalStorageData(storageData);

      // Get token info
      const tokens = AuthUtils.getTokens();
      if (tokens?.accessToken) {
        try {
          const userData = AuthUtils.getUserFromToken(tokens.accessToken);
          const isExpired = AuthUtils.isTokenExpired(tokens.accessToken);
          setTokenInfo({
            hasToken: true,
            isExpired,
            userData,
            tokenLength: tokens.accessToken.length,
            tokenStart: tokens.accessToken.substring(0, 30) + "...",
          });
        } catch (error) {
          setTokenInfo({
            hasToken: true,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      } else {
        setTokenInfo({
          hasToken: false,
        });
      }
    }
  };

  useEffect(() => {
    refreshDebugData();
    const interval = setInterval(refreshDebugData, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, []);

  const clearAllStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      refreshDebugData();
    }
  };

  const forceCheckAuth = () => {
    checkAuthState();
    setTimeout(refreshDebugData, 100);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Authentication Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Context State */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            🔐 Auth Context State
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Has User:</span>
              <span
                className={`font-mono ${
                  user ? "text-green-600" : "text-red-600"
                }`}
              >
                {user ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Loading:</span>
              <span
                className={`font-mono ${
                  isLoading ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {isLoading ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Authenticated:</span>
              <span
                className={`font-mono ${
                  isAuthenticated ? "text-green-600" : "text-red-600"
                }`}
              >
                {isAuthenticated ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Is Initialized:</span>
              <span
                className={`font-mono ${
                  isInitialized ? "text-green-600" : "text-red-600"
                }`}
              >
                {isInitialized ? "TRUE" : "FALSE"}
              </span>
            </div>
            {user && (
              <div className="mt-4 p-3 bg-white rounded border">
                <h3 className="font-medium text-gray-800 mb-2">User Data:</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Token Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            🎫 Token Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Has Token:</span>
              <span
                className={`font-mono ${
                  tokenInfo?.hasToken ? "text-green-600" : "text-red-600"
                }`}
              >
                {tokenInfo?.hasToken ? "TRUE" : "FALSE"}
              </span>
            </div>
            {tokenInfo?.hasToken && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium">Is Expired:</span>
                  <span
                    className={`font-mono ${
                      tokenInfo?.isExpired ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {tokenInfo?.isExpired ? "TRUE" : "FALSE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Token Length:</span>
                  <span className="font-mono text-gray-600">
                    {tokenInfo?.tokenLength}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Token Preview:</span>
                  <div className="font-mono text-xs text-gray-600 mt-1 break-all">
                    {tokenInfo?.tokenStart}
                  </div>
                </div>
                {tokenInfo?.userData && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h3 className="font-medium text-gray-800 mb-2">
                      Token Payload:
                    </h3>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(tokenInfo.userData, null, 2)}
                    </pre>
                  </div>
                )}
                {tokenInfo?.error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
                    <h3 className="font-medium text-red-800 mb-2">
                      Token Error:
                    </h3>
                    <div className="text-sm text-red-600">
                      {tokenInfo.error}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* LocalStorage Contents */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">
            💾 localStorage Contents
          </h2>
          <div className="space-y-2 text-sm">
            {Object.keys(localStorageData).length === 0 ? (
              <div className="text-gray-500 italic">localStorage is empty</div>
            ) : (
              Object.entries(localStorageData).map(([key, value]) => (
                <div key={key} className="border-b border-purple-100 pb-2">
                  <div className="font-medium text-purple-800">{key}:</div>
                  <div className="font-mono text-xs text-gray-600 mt-1 break-all">
                    {typeof value === "string" && value.length > 100
                      ? value.substring(0, 100) + "..."
                      : value}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            🛠️ Debug Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={refreshDebugData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Debug Data
            </button>
            <button
              onClick={forceCheckAuth}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔍 Force Auth Check
            </button>
            <button
              onClick={clearAllStorage}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Clear All Storage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔄 Reload Page
            </button>
          </div>

          <div className="mt-4 p-3 bg-white rounded border">
            <h3 className="font-medium text-gray-800 mb-2">💡 Instructions:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>1. Login on another page</li>
              <li>2. Come back here and check if tokens persist</li>
              <li>3. Reload this page and see if tokens are still there</li>
              <li>4. Check browser console for detailed logs</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📊 Debug Summary
        </h2>
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            <strong>Expected Behavior:</strong> After login, tokens should
            persist in localStorage and user should remain authenticated after
            page reload.
          </p>
          <p className="mb-2">
            <strong>Issue:</strong> If tokens exist but user gets redirected to
            login, there might be a timing issue in the auth context.
          </p>
          <p>
            <strong>Debug:</strong> Check browser console for detailed logs with
            emoji prefixes (🔍, 💾, 🔑, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
