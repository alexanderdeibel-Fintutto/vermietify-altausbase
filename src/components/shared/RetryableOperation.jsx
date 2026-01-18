import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function RetryableOperation({ onRetry, error }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="font-semibold mb-2">Ein Fehler ist aufgetreten</h3>
      <p className="text-sm text-[var(--theme-text-secondary)] mb-4">{error}</p>
      <Button variant="gradient" onClick={handleRetry} disabled={retrying}>
        <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
        Erneut versuchen
      </Button>
    </div>
  );
}