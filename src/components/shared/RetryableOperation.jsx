import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function RetryableOperation({ 
  error, 
  onRetry, 
  maxRetries = 3,
  currentRetry = 0 
}) {
  if (!error) return null;

  return (
    <div className="p-6 text-center">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-[var(--vf-error-500)]" />
      <h3 className="font-semibold mb-2">Ein Fehler ist aufgetreten</h3>
      <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
        {error.message || 'Unbekannter Fehler'}
      </p>
      {currentRetry < maxRetries && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen ({currentRetry + 1}/{maxRetries})
        </Button>
      )}
    </div>
  );
}