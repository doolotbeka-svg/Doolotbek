import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  titleFallback?: string;
  className?: string;
  priority?: boolean;
}

export function ResilientImage({
  src,
  alt,
  titleFallback,
  className = '',
  priority = false,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#16161C] via-[#1C1629] to-[#0E1A1C] p-6 text-center ${className}`}
      >
        <Sparkles className="h-6 w-6 text-[#8B5CF6]/70" aria-hidden="true" />
        <span className="text-xs font-medium text-white/60">
          {titleFallback || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
