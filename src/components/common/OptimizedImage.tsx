import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

function formatSrc(url: string, fallback: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) return fallback;
  if (url.includes('images.unsplash.com') && !url.includes('auto=format')) {
    return `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&q=80`;
  }
  return url;
}

/**
 * Robust, high-performance responsive image component:
 * - Immediate display with zero stuck loading states (handles browser cache & iOS Safari instantly)
 * - Safe image error fallback
 * - Full touch and responsive mobile support
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  fill = false,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(() => formatSrc(src, fallbackSrc));
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Sync state whenever src changes
  useEffect(() => {
    const formatted = formatSrc(src, fallbackSrc);
    setImgSrc(formatted);
    setHasError(false);

    // Check if the image is already cached/completed in browser memory
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else if (priority) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src, fallbackSrc, priority]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsLoaded(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const containerClasses = fill
    ? `absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
        isLoaded ? 'opacity-100' : 'opacity-90'
      } ${className}`
    : `transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-90'} ${className}`;

  return (
    <div className={`relative ${fill ? 'w-full h-full overflow-hidden' : 'inline-block'}`}>
      {!isLoaded && !priority && (
        <div
          className={`bg-slate-800/80 animate-pulse pointer-events-none ${
            fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
          }`}
        />
      )}
      <img
        ref={(node) => {
          imgRef.current = node;
          if (node && node.complete && node.naturalWidth > 0 && !isLoaded) {
            setIsLoaded(true);
          }
        }}
        src={imgSrc || fallbackSrc}
        alt={alt || 'GizmoTek Gadget'}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={containerClasses}
        {...props}
      />
    </div>
  );
}
