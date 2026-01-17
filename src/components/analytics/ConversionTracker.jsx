import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function ConversionTracker({ eventType, eventData = {} }) {
  useEffect(() => {
    const trackConversion = async () => {
      try {
        await base44.analytics.track({
          eventName: eventType,
          properties: {
            ...eventData,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer
          }
        });
      } catch (error) {
        console.error('Tracking error:', error);
      }
    };

    trackConversion();
  }, [eventType]);

  return null;
}