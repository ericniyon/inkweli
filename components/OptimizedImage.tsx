"use client";

import React from "react";
import Image from "next/image";

const OPTIMIZED_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "source.unsplash.com",
  "i.pravatar.cc",
];

function isOptimizableSrc(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  if (src.startsWith("data:")) return false;
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return OPTIMIZED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Use for fixed-size images (avatars, icons). */
  width?: number;
  height?: number;
  /** Use for responsive fill (e.g. featured image). Parent must have position relative and size. */
  fill?: boolean;
  /** When fill, hint for responsive sizes (e.g. "100vw" or "(max-width: 768px) 100vw, 800px"). */
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

/**
 * Renders an image using next/image when the URL can be optimized (same-origin or allowed remote),
 * otherwise falls back to a lazy-loaded img to avoid breaking unknown domains.
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  unoptimized = false,
}: OptimizedImageProps) {
  const effectiveSrc = src || "";
  const useNextImage =
    !unoptimized && isOptimizableSrc(effectiveSrc) && (fill || (width != null && height != null));

  if (useNextImage) {
    return (
      <Image
        src={effectiveSrc}
        alt={alt}
        className={className}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        unoptimized={false}
      />
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      {...(width != null && { width })}
      {...(height != null && { height })}
    />
  );
}
