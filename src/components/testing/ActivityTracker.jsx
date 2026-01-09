import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useActivityTracker() {
  const sessionIdRef = useRef(null);
  const pageStartTimeRef = useRef(Date.now());
  const userCacheRef = useRef(null);
  const testAccountCacheRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const clickDebounceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const MIN_CLICK_INTERVAL = 1000;

    // Lazy load user and test account
    const initializeTracking = async () => {
      try {
        if (!userCacheRef.current) {
          userCacheRef.current = await base44.auth.me();
        }
        if (!userCacheRef.current || testAccountCacheRef.current) return;

        const testAccounts = await base44.entities.TestAccount.filter(
          { user_email: userCacheRef.current.email },
          '-created_date',
          1
        );
        if (isMounted && testAccounts[0]) {
          testAccountCacheRef.current = testAccounts[0];
        }
      } catch (error) {
        console.debug('Activity tracking initialization skipped');
      }
    };

    const handleClick = async (e) => {
      const now = Date.now();
      if (now - lastClickTimeRef.current < MIN_CLICK_INTERVAL) return;

      if (clickDebounceRef.current) clearTimeout(clickDebounceRef.current);
      
      clickDebounceRef.current = setTimeout(async () => {
        if (!isMounted || !testAccountCacheRef.current) return;
        
        try {
          const target = e.target;
          await base44.functions.invoke('trackTesterActivity', {
            test_account_id: testAccountCacheRef.current.id,
            activity_type: 'click',
            page_url: window.location.pathname,
            page_title: document.title,
            element_data: {
              selector: target.className || target.id || target.tagName,
              text: target.textContent?.substring(0, 100),
              type: target.tagName.toLowerCase()
            }
          });
          lastClickTimeRef.current = now;
        } catch (error) {
          console.debug('Click tracking skipped');
        }
      }, 500);
    };

    initializeTracking();
    document.addEventListener('click', handleClick);

    return () => {
      isMounted = false;
      if (clickDebounceRef.current) clearTimeout(clickDebounceRef.current);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return sessionIdRef.current;
}