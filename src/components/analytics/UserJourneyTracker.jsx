import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function UserJourneyTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await base44.analytics.track({
          eventName: 'page_view',
          properties: {
            path: location.pathname,
            url: window.location.href,
            referrer: document.referrer
          }
        });
      } catch (error) {
        console.error('Journey tracking error:', error);
      }
    };

    trackPageView();
  }, [location.pathname]);

  return null;
}