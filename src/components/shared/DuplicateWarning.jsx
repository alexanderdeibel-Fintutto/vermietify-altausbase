import React from 'react';
import { AlertTriangle, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DuplicateWarning({ 
  duplicates = [],
  onMerge,
  onIgnore
}) {
  if (duplicates.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-amber-900">
              {duplicates.length} mögliche Duplikate gefunden
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              Es wurden ähnliche Einträge gefunden. Möchten Sie diese zusammenführen?
            </p>
            
            <div className="mt-3 space-y-1">
              {duplicates.map((dup, idx) => (
                <div key={idx} className="text-xs text-amber-700 flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-600 rounded-full" />
                  {dup.label}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={onMerge}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 gap-2 text-xs"
              >
                <Link2 className="w-3 h-3" />
                Zusammenführen
              </Button>
              <Button
                onClick={onIgnore}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Ignorieren
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}