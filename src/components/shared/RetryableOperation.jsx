import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RetryableOperation({ 
  operation, 
  onSuccess, 
  onError,
  maxRetries = 3,
  children 
}) {
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = async () => {
    setRetrying(true);
    setError(null);

    try {
      const result = await operation();
      onSuccess?.(result);
      setRetryCount(0);
      toast.success('Operation erfolgreich');
    } catch (err) {
      console.error('Operation failed:', err);
      setError(err.message);

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        toast.error(`Fehler aufgetreten. Versuche automatisch erneut... (${retryCount + 1}/${maxRetries})`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => executeWithRetry(), delay);
      } else {
        onError?.(err);
        toast.error('Operation nach mehreren Versuchen fehlgeschlagen');
      }
    } finally {
      setRetrying(false);
    }
  };

  if (error && retryCount >= maxRetries) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRetryCount(0);
              setError(null);
              executeWithRetry();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return children({ execute: executeWithRetry, retrying, error, retryCount });
}