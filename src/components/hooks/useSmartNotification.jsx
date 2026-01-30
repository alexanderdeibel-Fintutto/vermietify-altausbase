import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useSmartNotification() {
  const notificationMap = useRef({});

  const notify = useCallback((key, message, options = {}) => {
    const {
      type = 'info',
      duration = 3000,
      action = null,
      grouping = false
    } = options;

    if (grouping && notificationMap.current[key]) {
      return;
    }

    notificationMap.current[key] = true;

    const toastFn = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
      loading: toast.loading
    }[type];

    const id = toastFn(message, {
      duration,
      action: action ? {
        label: action.label,
        onClick: () => {
          action.onClick();
          toast.dismiss(id);
        }
      } : undefined
    });

    setTimeout(() => {
      delete notificationMap.current[key];
    }, duration);

    return id;
  }, []);

  return { notify };
}