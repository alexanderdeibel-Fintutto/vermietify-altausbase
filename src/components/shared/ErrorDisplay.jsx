import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorDisplay({ error, onRetry }) {
  return (
    <Card className="p-8 text-center border-red-200 bg-red-50">
      <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2 text-red-900">Fehler aufgetreten</h2>
      <p className="text-red-700 mb-6">{error?.message || 'Ein unbekannter Fehler ist aufgetreten'}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      )}
    </Card>
  );
}