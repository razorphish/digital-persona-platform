"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

interface VirtualScrollListRef {
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
  scrollToTop: (behavior?: ScrollBehavior) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  getScrollTop: () => number;
}

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = "",
  onScroll,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length, endIndex + overscan),
      visibleStart: startIndex,
      visibleEnd: endIndex,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const totalHeight = useMemo(
    () => items.length * itemHeight,
    [items.length, itemHeight]
  );

  const offsetY = useMemo(
    () => visibleRange.start * itemHeight,
    [visibleRange.start, itemHeight]
  );

  const visibleItems = useMemo(() => {
    return items
      .slice(visibleRange.start, visibleRange.end)
      .map((item, index) => ({
        item,
        index: visibleRange.start + index,
      }));
  }, [items, visibleRange.start, visibleRange.end]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight;
        containerRef.current.scrollTo({
          top: scrollTop,
          behavior,
        });
      }
    },
    [itemHeight]
  );

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      scrollToIndex(0, behavior);
    },
    [scrollToIndex]
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      scrollToIndex(items.length - 1, behavior);
    },
    [scrollToIndex, items.length]
  );

  // Scroll methods are available through the returned object if needed
  // For now, we'll keep the component simple without imperative handles

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "relative",
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                height: itemHeight,
                position: "relative",
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Create a memoized version
const VirtualScrollListMemo = React.memo(VirtualScrollList) as <T>(
  props: VirtualScrollListProps<T>
) => React.ReactElement;

export default VirtualScrollListMemo;
