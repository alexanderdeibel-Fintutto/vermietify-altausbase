import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function AnalyticsEventTracker({ eventName, properties }) {
  useEffect(() => {
    if (eventName) {
      base44.analytics.track({ eventName, properties });
    }
  }, [eventName, properties]);

  return null;
}