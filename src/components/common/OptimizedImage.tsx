import React, { useState } from 'react';
import { FALLBACK_PRODUCT_IMAGE } from '@/lib/constants';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}

function formatSrc(url: string, fallback: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  if (url.includes('images.unsplash.com') && !url.includes('auto=format')) {
    return `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&q=80`;
  }
  return url;
}

/**
 * Responsive image with a shimmer placeholder and fade-in:
 * - Load/error state is derived from the current src, so swapping images never flashes stale content
 * - Already-cached images are detected immediately (no stuck placeholders on iOS Safari)
 * - Broken URLs fall back to a default product image
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = FALLBACK_PRODUCT_IMAGE,
  fill = false,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  const requestedSrc = formatSrc(src, fallbackSrc);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const imgSrc = failedSrc === requestedSrc ? fallbackSrc : requestedSrc;
  const isLoaded = priority || loadedSrc === imgSrc;

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setFailedSrc(requestedSrc);
    } else {
      setLoadedSrc(imgSrc);
    }
  };

  const imageClasses = `${fill ? 'absolute inset-0 w-full h-full object-contain' : ''} transition-opacity duration-300 ${
    isLoaded ? 'opacity-100' : 'opacity-0'
  } ${className}`;

  return (
    <div className={`relative ${fill ? 'w-full h-full overflow-hidden' : 'inline-block'}`}>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className={`skeleton pointer-events-none ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`}
        />
      )}
      <img
        ref={(node) => {
          if (node && node.complete && node.naturalWidth > 0 && loadedSrc !== imgSrc) {
            setLoadedSrc(imgSrc);
          }
        }}
        src={imgSrc}
        alt={alt || 'GizmoTek Gadget'}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setLoadedSrc(imgSrc)}
        onError={handleError}
        className={imageClasses}
        {...props}
      />
    </div>
  );
}
