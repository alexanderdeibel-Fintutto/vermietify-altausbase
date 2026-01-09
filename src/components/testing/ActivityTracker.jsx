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
        const testAccount = await base44.entities.TestAccount.filter(
          { user_email: user.email },
          '-created_date',
          1
        );
        
        if (testAccount[0]) {
          await base44.functions.invoke('trackTesterActivity', {
            test_account_id: testAccount[0].id,
            activity_type: 'page_visit',
            page_url: window.location.pathname,
            page_title: document.title,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            time_spent_seconds: Math.round((Date.now() - pageStartTimeRef.current) / 1000)
          });
        }
      } catch (error) {
        console.error('Activity tracking error:', error);
      }
    };

    const handleClick = async (e) => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        const testAccount = await base44.entities.TestAccount.filter(
          { user_email: user.email },
          '-created_date',
          1
        );
        
        if (!testAccount[0]) return;

        const target = e.target;
        await base44.functions.invoke('trackTesterActivity', {
          test_account_id: testAccount[0].id,
          activity_type: 'click',
          page_url: window.location.pathname,
          page_title: document.title,
          element_data: {
            selector: target.className || target.id || target.tagName,
            text: target.textContent?.substring(0, 100),
            type: target.tagName.toLowerCase()
          },
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
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