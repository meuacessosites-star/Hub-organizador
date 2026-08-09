import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { formatImageUrl, getNextFallbackUrl } from '../utils/imageProxy';

// Global memory cache of successfully loaded and failed images for instant rendering across component remounts
export const LOADED_IMAGE_CACHE = new Set<string>();
export const FAILED_IMAGE_CACHE = new Set<string>();

/**
 * Preload an image URL into browser & JS memory cache
 */
export const preloadImage = (src?: string | null) => {
  const formatted = formatImageUrl(src);
  if (!formatted || LOADED_IMAGE_CACHE.has(formatted) || FAILED_IMAGE_CACHE.has(formatted)) return;
  const img = new Image();
  img.src = formatted;
  img.onload = () => {
    LOADED_IMAGE_CACHE.add(formatted);
  };
  img.onerror = () => {
    FAILED_IMAGE_CACHE.add(formatted);
  };
};

/**
 * Batch preload multiple image URLs
 */
export const preloadImages = (srcs: (string | null | undefined)[]) => {
  if (!srcs || !Array.isArray(srcs)) return;
  srcs.forEach(preloadImage);
};

export interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  showLoadingSkeleton?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt = 'Imagem',
  className = 'w-full h-full',
  containerClassName = 'w-full h-full',
  fallbackIcon,
  fallbackText,
  showLoadingSkeleton = true,
  objectFit = 'cover',
  onClick,
  style,
  id,
  ...imgProps
}) => {
  const initialFormatted = formatImageUrl(src);
  const isPreLoaded = initialFormatted ? LOADED_IMAGE_CACHE.has(initialFormatted) : false;

  const [currentSrc, setCurrentSrc] = useState<string>(initialFormatted);
  const [loading, setLoading] = useState<boolean>(initialFormatted ? !isPreLoaded : false);
  const [error, setError] = useState<boolean>(!initialFormatted);
  const [triedUrls, setTriedUrls] = useState<Set<string>>(new Set([initialFormatted]));

  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already completed in DOM cache on mount or src change
  useEffect(() => {
    const formatted = formatImageUrl(src);
    if (!formatted) {
      setCurrentSrc('');
      setLoading(false);
      setError(true);
      setTriedUrls(new Set());
    } else {
      setCurrentSrc(formatted);
      const isCached = LOADED_IMAGE_CACHE.has(formatted);
      setLoading(!isCached);
      setError(false);
      setTriedUrls(new Set([formatted]));

      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [src]);

  // Synchronous check if browser already finished decoding this image
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      if (currentSrc) LOADED_IMAGE_CACHE.add(currentSrc);
      setLoading(false);
      setError(false);
    }
  }, [currentSrc]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc) FAILED_IMAGE_CACHE.add(currentSrc);

    // Also notify any parent-provided onError handler
    if (imgProps.onError) {
      try {
        imgProps.onError(e);
      } catch (err) {
        console.error('Error in parent onError handler:', err);
      }
    }

    let nextCandidate = getNextFallbackUrl(currentSrc, src || undefined);
    
    // Cycle through fallback candidates until finding one not tried yet
    let loopCount = 0;
    const localVisited = new Set<string>();
    while (nextCandidate && (triedUrls.has(nextCandidate) || FAILED_IMAGE_CACHE.has(nextCandidate)) && loopCount < 10) {
      if (localVisited.has(nextCandidate)) {
        nextCandidate = null;
        break;
      }
      localVisited.add(nextCandidate);
      nextCandidate = getNextFallbackUrl(nextCandidate, src || undefined);
      loopCount++;
    }

    if (nextCandidate && !triedUrls.has(nextCandidate)) {
      setTriedUrls((prev) => {
        const next = new Set(prev);
        next.add(nextCandidate!);
        return next;
      });
      setCurrentSrc(nextCandidate);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleImgLoad = () => {
    if (currentSrc) LOADED_IMAGE_CACHE.add(currentSrc);
    setLoading(false);
    setError(false);
  };

  const fitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      className={`relative overflow-hidden select-none flex items-center justify-center ${containerClassName}`}
      onClick={onClick}
    >
      {/* Fallback View when URL fails, is empty, or while loading when fallbackIcon is provided */}
      {fallbackIcon ? (
        <div className="absolute inset-0 z-0 flex items-center justify-center w-full h-full rounded-inherit overflow-hidden">
          {fallbackIcon}
        </div>
      ) : error || !currentSrc ? (
        <div
          id={id}
          className="w-full h-full min-h-[100%] bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200/40 dark:border-neutral-800/50 flex flex-col items-center justify-center p-1 text-neutral-400 dark:text-neutral-500 rounded-inherit select-none overflow-hidden"
        >
          <ImageOff className="w-[45%] h-[45%] max-w-6 max-h-6 min-w-3 min-h-3 stroke-[1.75] text-neutral-400 dark:text-neutral-500 opacity-80" />
          {fallbackText && (
            <span className="mt-1 text-[10px] font-medium text-neutral-400 dark:text-neutral-500 text-center line-clamp-1">
              {fallbackText}
            </span>
          )}
        </div>
      ) : null}

      {/* Skeleton / Loading State if no fallbackIcon provided */}
      {loading && showLoadingSkeleton && !error && !fallbackIcon && (
        <div className="absolute inset-0 z-10 bg-neutral-200/80 dark:bg-neutral-800/80 animate-pulse flex items-center justify-center rounded-inherit" />
      )}

      {/* Actual Image */}
      {currentSrc && !error && (
        <img
          {...imgProps}
          ref={imgRef}
          id={id}
          src={currentSrc}
          alt={alt}
          loading={imgProps.loading || "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={handleImgLoad}
          onError={handleImgError}
          className={`relative z-10 ${className} ${fitClass} transition-opacity duration-150 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          style={style}
        />
      )}
    </div>
  );
};
