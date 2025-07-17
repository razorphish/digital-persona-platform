"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ImageIcon, AlertCircle } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  quality?: number;
}

const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  fallbackSrc,
  placeholder,
  onLoad,
  onError,
  lazy = true,
  quality = 75,
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState("loaded");
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageState("error");
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageState("loading");
    } else {
      onError?.();
    }
  }, [currentSrc, fallbackSrc, onError]);

  const optimizedSrc = useMemo(() => {
    if (!src.startsWith("http")) return currentSrc;

    // Add query parameters for optimization if it's an external URL
    const url = new URL(currentSrc);
    if (width) url.searchParams.set("w", width.toString());
    if (height) url.searchParams.set("h", height.toString());
    url.searchParams.set("q", quality.toString());
    url.searchParams.set("f", "webp");

    return url.toString();
  }, [currentSrc, width, height, quality]);

  const imageStyle = useMemo(
    () => ({
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
    }),
    [width, height]
  );

  const defaultPlaceholder = useMemo(
    () => (
      <div
        className={`flex items-center justify-center bg-white/10 border border-white/20 rounded ${className}`}
        style={imageStyle}
      >
        <ImageIcon className="h-8 w-8 text-white/30" />
      </div>
    ),
    [className, imageStyle]
  );

  const errorFallback = useMemo(
    () => (
      <div
        className={`flex flex-col items-center justify-center bg-red-500/10 border border-red-500/20 rounded text-red-400 p-4 ${className}`}
        style={imageStyle}
      >
        <AlertCircle className="h-6 w-6 mb-2" />
        <span className="text-xs text-center">Failed to load image</span>
      </div>
    ),
    [className, imageStyle]
  );

  if (imageState === "error" && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return errorFallback;
  }

  return (
    <div className={`relative ${className}`} style={imageStyle}>
      {imageState === "loading" && (placeholder || defaultPlaceholder)}

      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          imageState === "loaded" ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={imageStyle}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

export default OptimizedImage;
