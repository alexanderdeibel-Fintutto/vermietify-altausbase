import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function OptimizedImage({ src, alt, className, fallback }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[var(--theme-surface)] ${className}`}>
        {fallback || <ImageOff className="h-8 w-8 text-[var(--theme-text-muted)]" />}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}