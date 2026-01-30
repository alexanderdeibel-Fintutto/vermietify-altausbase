import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useOptimisticUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (updateFn, optimisticData, onSuccess, onError) => {
    setLoading(true);
    setError(null);

    // Apply optimistic update immediately
    if (onSuccess) {
      onSuccess(optimisticData);
    }

    try {
      const result = await updateFn();
      toast.success('Gespeichert');
      return result;
    } catch (err) {
      setError(err.message);
      toast.error('Fehler beim Speichern');
      
      // Rollback on error
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}