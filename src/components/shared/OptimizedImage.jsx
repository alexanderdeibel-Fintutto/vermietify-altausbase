import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  placeholder = '/placeholder.jpg',
  lazy = true
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-slate-200 animate-pulse"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : 'none',
            backgroundSize: 'cover',
            filter: 'blur(10px)'
          }}
        />
      )}

      {/* Actual Image */}
      {isVisible && (
        <motion.img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}