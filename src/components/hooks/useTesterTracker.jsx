import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

let trackingActive = false;
let currentTestAccountId = null;

const throttle = (func, delay) => {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= delay) {
      func(...args);
      lastRun = now;
    }
  };
};

export const useTesterTracker = (testAccountId) => {
  const location = useLocation();
  const pageStartTime = useRef(Date.now());

  useEffect(() => {
    if (!testAccountId) return;
    
    trackingActive = true;
    currentTestAccountId = testAccountId;
    pageStartTime.current = Date.now();

    // Track page visit
    const trackPageVisit = async () => {
      try {
        await base44.functions.invoke('trackTesterActivity', {
          test_account_id: testAccountId,
          activity_type: 'page_visit',
          page_url: window.location.href,
          page_title: document.title
        });
      } catch (err) {
        console.error('Page tracking failed:', err);
      }
    };

    trackPageVisit();

    // Track clicks
    const handleClick = async (event) => {
      if (!trackingActive) return;

      try {
        const target = event.target;
        await base44.functions.invoke('trackTesterActivity', {
          test_account_id: testAccountId,
          activity_type: 'click',
          element_data: {
            selector: target.id || target.className,
            text: target.textContent?.slice(0, 100),
            type: target.tagName.toLowerCase()
          },
          page_url: window.location.href
        });
      } catch (err) {
        console.error('Click tracking failed:', err);
      }
    };

    // Track scroll (throttled)
    const handleScroll = throttle(async () => {
      if (!trackingActive) return;

      try {
        await base44.functions.invoke('trackTesterActivity', {
          test_account_id: testAccountId,
          activity_type: 'scroll',
          page_url: window.location.href
        });
      } catch (err) {
        console.error('Scroll tracking failed:', err);
      }
    }, 10000);

    // Add event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);

    // Calculate and save time spent on page
    return () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      
      if (timeSpent > 5) {
        try {
          base44.functions.invoke('trackTesterActivity', {
            test_account_id: testAccountId,
            activity_type: 'page_visit',
            time_spent_seconds: timeSpent,
            page_url: window.location.href,
            page_title: document.title
          }).catch(err => console.error('Time tracking failed:', err));
        } catch (err) {
          console.error('Time tracking failed:', err);
        }
      }

      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location, testAccountId]);

  // Form submission tracking
  useEffect(() => {
    const handleSubmit = async (event) => {
      if (!trackingActive) return;

      try {
        const form = event.target;
        const formData = new FormData(form);
        const fields = Array.from(formData.keys());

        await base44.functions.invoke('trackTesterActivity', {
          test_account_id: testAccountId,
          activity_type: 'form_submit',
          element_data: {
            fields,
            form_name: form.name || form.id
          },
          page_url: window.location.href
        });
      } catch (err) {
        console.error('Form tracking failed:', err);
      }
    };

    document.addEventListener('submit', handleSubmit, true);
    return () => document.removeEventListener('submit', handleSubmit, true);
  }, [testAccountId]);
};

export default useTesterTracker;