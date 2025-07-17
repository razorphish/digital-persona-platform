"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface UseApiCacheOptions {
  staleTime?: number; // Time in ms before data is considered stale
  cacheTime?: number; // Time in ms before cached data is garbage collected
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
}

const globalCache = new Map<string, CacheEntry<any>>();
const subscribers = new Map<string, Set<() => void>>();

function useApiCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseApiCacheOptions = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = true,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const fetcherRef = useRef(fetcher);
  const intervalRef = useRef<NodeJS.Timeout>();
  fetcherRef.current = fetcher;

  const fetchData = useCallback(
    async (force = false) => {
      const cached = globalCache.get(key);
      const now = Date.now();

      // Return cached data if it's fresh and not forced
      if (
        !force &&
        cached &&
        now - cached.timestamp < staleTime &&
        !cached.isStale
      ) {
        setData(cached.data);
        setError(null);
        return cached.data;
      }

      // Set loading state only if no cached data exists
      if (!cached) {
        setIsLoading(true);
      } else {
        setIsValidating(true);
      }

      setError(null);

      try {
        const result = await fetcherRef.current();

        // Update cache
        globalCache.set(key, {
          data: result,
          timestamp: now,
          isStale: false,
        });

        setData(result);
        setError(null);

        // Notify all subscribers
        const keySubscribers = subscribers.get(key);
        if (keySubscribers) {
          keySubscribers.forEach((callback) => callback());
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);

        // If we have stale data, use it
        if (cached) {
          setData(cached.data);
          globalCache.set(key, { ...cached, isStale: true });
        }

        throw error;
      } finally {
        setIsLoading(false);
        setIsValidating(false);
      }
    },
    [key, staleTime]
  );

  const mutate = useCallback(
    async (newData?: T | ((prevData: T | undefined) => T)) => {
      if (typeof newData === "function") {
        const currentData = globalCache.get(key)?.data;
        const updatedData = (newData as (prevData: T | undefined) => T)(
          currentData
        );

        globalCache.set(key, {
          data: updatedData,
          timestamp: Date.now(),
          isStale: false,
        });

        setData(updatedData);
      } else if (newData !== undefined) {
        globalCache.set(key, {
          data: newData,
          timestamp: Date.now(),
          isStale: false,
        });

        setData(newData);
      } else {
        // Refetch
        return fetchData(true);
      }

      // Notify subscribers
      const keySubscribers = subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.forEach((callback) => callback());
      }
    },
    [key, fetchData]
  );

  const invalidate = useCallback(() => {
    const cached = globalCache.get(key);
    if (cached) {
      globalCache.set(key, { ...cached, isStale: true });
    }
  }, [key]);

  // Subscribe to cache updates
  useEffect(() => {
    const updateData = () => {
      const cached = globalCache.get(key);
      if (cached) {
        setData(cached.data);
      }
    };

    if (!subscribers.has(key)) {
      subscribers.set(key, new Set());
    }

    subscribers.get(key)!.add(updateData);

    return () => {
      subscribers.get(key)?.delete(updateData);
      if (subscribers.get(key)?.size === 0) {
        subscribers.delete(key);
      }
    };
  }, [key]);

  // Initial fetch and cache check
  useEffect(() => {
    const cached = globalCache.get(key);
    if (cached) {
      setData(cached.data);

      // Check if data is stale
      const now = Date.now();
      if (cached.isStale || now - cached.timestamp >= staleTime) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [key, fetchData, staleTime]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = globalCache.get(key);
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp >= staleTime) {
          fetchData();
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [key, fetchData, refetchOnWindowFocus, staleTime]);

  // Interval refetching
  useEffect(() => {
    if (!refetchInterval) return;

    intervalRef.current = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refetchInterval]);

  // Cleanup stale cache entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const entries = Array.from(globalCache.entries());
      for (const [cacheKey, entry] of entries) {
        if (now - entry.timestamp > cacheTime) {
          globalCache.delete(cacheKey);
        }
      }
    };

    const cleanupInterval = setInterval(cleanup, cacheTime);
    return () => clearInterval(cleanupInterval);
  }, [cacheTime]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    invalidate,
    refetch: () => fetchData(true),
  };
}

export default useApiCache;
