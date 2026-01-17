import { toast } from 'sonner';

export const showSuccess = (message, description) => {
  toast.success(message, { description });
};

export const showError = (message, description) => {
  toast.error(message, { description });
};

export const showWarning = (message, description) => {
  toast.warning(message, { description });
};

export const showInfo = (message, description) => {
  toast.info(message, { description });
};

export const showPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Lädt...',
    success: messages.success || 'Erfolgreich!',
    error: messages.error || 'Fehler aufgetreten'
  });
};