import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function useToast() {
  const notify = {
    success: (message, description) => {
      toast.success(message, {
        description,
        icon: <CheckCircle2 className="w-5 h-5" />,
        duration: 3000,
      });
    },
    error: (message, description) => {
      toast.error(message, {
        description,
        icon: <AlertCircle className="w-5 h-5" />,
        duration: 5000,
      });
    },
    info: (message, description) => {
      toast.info(message, {
        description,
        icon: <Info className="w-5 h-5" />,
        duration: 4000,
      });
    },
    warning: (message, description) => {
      toast.warning(message, {
        description,
        icon: <AlertTriangle className="w-5 h-5" />,
        duration: 4000,
      });
    },
    promise: async (promise, messages) => {
      return toast.promise(promise, {
        loading: messages.loading || 'Wird verarbeitet...',
        success: messages.success || 'Erfolgreich!',
        error: messages.error || 'Fehler aufgetreten',
      });
    }
  };

  return notify;
}

export default useToast;