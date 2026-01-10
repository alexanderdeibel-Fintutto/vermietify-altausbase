import { useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export const useWidgetInteraction = (widgetId) => {
  const startTimeRef = useRef(null);
  const engagementRef = useRef(0);

  const trackInteraction = useCallback(async (action, engagement = 0, relevance = 0) => {
    try {
      const timeSpent = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      await base44.functions.invoke('trackWidgetInteraction', {
        widget_id: widgetId,
        action,
        time_spent_seconds: timeSpent,
        engagement_score: Math.max(engagementRef.current, engagement),
        relevance_score: relevance
      });

      startTimeRef.current = null;
      engagementRef.current = 0;
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [widgetId]);

  const startTracking = useCallback((engagement = 0) => {
    startTimeRef.current = Date.now();
    engagementRef.current = Math.max(engagementRef.current, engagement);
  }, []);

  const endTracking = useCallback(async (action = 'view', relevance = 0) => {
    await trackInteraction(action, engagementRef.current, relevance);
  }, [trackInteraction]);

  return {
    trackInteraction,
    startTracking,
    endTracking
  };
};