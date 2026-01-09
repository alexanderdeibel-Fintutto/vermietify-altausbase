import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function BankIntegrationForm({ onSubmit, isLoading }) {
  const handleConnect = () => {
    onSubmit({ finapi_requested: true });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm font-light text-blue-900">
          <p className="font-medium mb-1">Bankverbindung optional</p>
          <p className="text-xs">Wir können Ihre Konten automatisch synchronisieren für mehr Komfort.</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Verbindung...' : 'FinAPI verbinden'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onSubmit({ finapi_requested: false })}
          disabled={isLoading}
          className="w-full"
        >
          Später machen
        </Button>
      </div>
    </div>
  );
}