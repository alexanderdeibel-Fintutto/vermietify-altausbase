import React, { useRef, useEffect, useState } from 'react';
import AnimatedSpinner from '../animations/AnimatedSpinner';

export default function LazyLoadTrigger({ onVisible, threshold = 0.1, children, fallback }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsVisible(true);
          if (onVisible) {
            onVisible();
          }
          setIsLoaded(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [onVisible, threshold, isLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || (
        <div className="flex justify-center py-8">
          <AnimatedSpinner />
        </div>
      ))}
    </div>
  );
}