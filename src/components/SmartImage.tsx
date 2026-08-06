import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { formatImageUrl, getNextFallbackUrl } from '../utils/imageProxy';

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
  const [currentSrc, setCurrentSrc] = useState<string>(initialFormatted);
  const [loading, setLoading] = useState<boolean>(!!initialFormatted);
  const [error, setError] = useState<boolean>(!initialFormatted);
  const [triedUrls, setTriedUrls] = useState<Set<string>>(new Set([initialFormatted]));

  useEffect(() => {
    const formatted = formatImageUrl(src);
    if (!formatted) {
      setCurrentSrc('');
      setLoading(false);
      setError(true);
      setTriedUrls(new Set());
    } else {
      setCurrentSrc(formatted);
      setLoading(true);
      setError(false);
      setTriedUrls(new Set([formatted]));
    }
  }, [src]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    let nextCandidate = getNextFallbackUrl(currentSrc, src || undefined);
    
    // Cycle through fallback candidates until finding one not tried yet
    while (nextCandidate && triedUrls.has(nextCandidate)) {
      nextCandidate = getNextFallbackUrl(nextCandidate, src || undefined);
    }

    if (nextCandidate && !triedUrls.has(nextCandidate)) {
      setTriedUrls((prev) => new Set(prev).add(nextCandidate!));
      setCurrentSrc(nextCandidate);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const handleImgLoad = () => {
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
          id={id}
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={handleImgLoad}
          onError={handleImgError}
          className={`relative z-10 ${className} ${fitClass} transition-opacity duration-300 ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          style={style}
        />
      )}
    </div>
  );
};
