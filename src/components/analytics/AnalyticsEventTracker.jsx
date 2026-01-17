import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAnalyticsEvent(eventName, properties = {}, deps = []) {
  useEffect(() => {
    base44.analytics.track({
      eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }, deps);
}

export function trackEvent(eventName, properties = {}) {
  return base44.analytics.track({
    eventName,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
  });
}