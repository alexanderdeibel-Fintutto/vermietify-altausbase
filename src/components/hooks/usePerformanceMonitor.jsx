import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const mountTime = useRef(null);

  useEffect(() => {
    renderCount.current += 1;
    
    if (!mountTime.current) {
      mountTime.current = performance.now();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}`);
      
      if (renderCount.current > 10) {
        console.warn(`[${componentName}] High render count detected: ${renderCount.current}`);
      }
    }
  });

  const logPerformance = (label) => {
    if (process.env.NODE_ENV === 'development') {
      const now = performance.now();
      const elapsed = mountTime.current ? now - mountTime.current : 0;
      console.log(`[${componentName}] ${label}: ${elapsed.toFixed(2)}ms`);
    }
  };

  return { renderCount: renderCount.current, logPerformance };
}

export default usePerformanceMonitor;