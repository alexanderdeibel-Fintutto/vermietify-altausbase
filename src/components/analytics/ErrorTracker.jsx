import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function ErrorTracker({ errors = [] }) {
  const mockErrors = [
    { id: 1, message: 'Upload fehlgeschlagen', severity: 'medium', created_date: new Date() }
  ];

  const displayErrors = errors.length > 0 ? errors : mockErrors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Fehlerprotokoll
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayErrors.map((error) => (
            <div key={error.id} className="p-3 bg-[var(--vf-error-50)] rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--vf-error-700)]">{error.message}</div>
                  <TimeAgo date={error.created_date} className="text-xs text-[var(--vf-error-600)] mt-1" />
                </div>
                <span className="vf-badge vf-badge-error">{error.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}