import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function ErrorTracker() {
  useEffect(() => {
    const handleError = (event) => {
      base44.analytics.track({
        eventName: 'error_occurred',
        properties: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }).catch(console.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return null;
}