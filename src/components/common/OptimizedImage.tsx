import React, { useState } from 'react';

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

/**
 * High-performance image component replacing Next.js Image:
 * - Native lazy loading and asynchronous decoding
 * - Fallback handling on image failure
 * - Automatic WebP format transformation for Unsplash CDN assets
 * - Smooth skeleton loading transition
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
  const [imgSrc, setImgSrc] = useState(() => {
    if (!src) return fallbackSrc;
    // Optimize Unsplash images for WebP format and compression
    if (src.includes('images.unsplash.com') && !src.includes('auto=format')) {
      return `${src}${src.includes('?') ? '&' : '?'}auto=format&fit=crop&q=80`;
    }
    return src;
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const containerClasses = fill
    ? `absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`
    : `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`;

  return (
    <>
      {!isLoaded && (
        <div
          className={`bg-slate-800 animate-pulse ${
            fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'
          }`}
        />
      )}
      <img
        src={imgSrc || fallbackSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={containerClasses}
        {...props}
      />
    </>
  );
}
