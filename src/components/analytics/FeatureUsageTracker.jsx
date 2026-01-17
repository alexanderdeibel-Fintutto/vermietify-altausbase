import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function FeatureUsageTracker({ featureName, metadata = {} }) {
  useEffect(() => {
    const trackUsage = async () => {
      try {
        await base44.analytics.track({
          eventName: 'feature_used',
          properties: {
            feature: featureName,
            ...metadata
          }
        });
      } catch (error) {
        console.error('Feature tracking error:', error);
      }
    };

    trackUsage();
  }, [featureName]);

  return null;
}