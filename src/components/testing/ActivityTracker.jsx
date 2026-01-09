import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useActivityTracker() {
  const sessionIdRef = useRef(null);
  const pageStartTimeRef = useRef(Date.now());

  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        // Generiere Session-ID wenn nicht vorhanden
        if (!sessionIdRef.current) {
          sessionIdRef.current = `session_${Date.now()}_${Math.random()}`;
        }

        // Track Page Visit
        await base44.functions.invoke('trackTesterActivity', {
          activity_type: 'page_visit',
          page_url: window.location.pathname,
          page_title: document.title,
          session_id: sessionIdRef.current,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent: navigator.userAgent,
          duration_seconds: Math.round((Date.now() - pageStartTimeRef.current) / 1000)
        });
      } catch (error) {
        console.error('Activity tracking error:', error);
      }
    };

    const handleClick = async (e) => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const target = e.target;
        await base44.functions.invoke('trackTesterActivity', {
          activity_type: 'click',
          page_url: window.location.pathname,
          page_title: document.title,
          element_selector: target.className || target.id || target.tagName,
          element_text: target.textContent?.substring(0, 100),
          element_type: target.tagName.toLowerCase(),
          session_id: sessionIdRef.current,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Click tracking error:', error);
      }
    };

    // Track page visit on mount
    trackPageVisit();

    // Track clicks
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return sessionIdRef.current;
}