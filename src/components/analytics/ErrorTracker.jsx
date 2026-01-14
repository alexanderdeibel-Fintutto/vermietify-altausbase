import { base44 } from '@/api/base44Client';

class ErrorTracker {
  static track(error, context = {}) {
    try {
      base44.analytics.track({
        eventName: 'error_occurred',
        properties: {
          error_message: error?.message || 'Unknown error',
          error_type: error?.name || 'Error',
          context_page: context.page || window.location.pathname,
          context_action: context.action || 'unknown',
          stack_preview: error?.stack?.substring(0, 200) || null
        }
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  static trackFormError(formName, fieldName, errorMessage) {
    base44.analytics.track({
      eventName: 'form_validation_error',
      properties: {
        form_name: formName,
        field_name: fieldName,
        error_message: errorMessage
      }
    });
  }

  static trackAPIError(endpoint, statusCode, errorMessage) {
    base44.analytics.track({
      eventName: 'api_error',
      properties: {
        endpoint: endpoint,
        status_code: statusCode,
        error_message: errorMessage
      }
    });
  }

  static trackUserFrustration(action, attemptCount) {
    if (attemptCount >= 3) {
      base44.analytics.track({
        eventName: 'user_frustration_detected',
        properties: {
          action: action,
          attempt_count: attemptCount
        }
      });
    }
  }
}

export default ErrorTracker;

// React Hook for error tracking
export function useErrorTracking(pageName) {
  React.useEffect(() => {
    const handleError = (event) => {
      ErrorTracker.track(event.error, { page: pageName, action: 'runtime_error' });
    };

    const handleRejection = (event) => {
      ErrorTracker.track(event.reason, { page: pageName, action: 'unhandled_promise' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [pageName]);
}