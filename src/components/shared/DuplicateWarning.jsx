import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DuplicateWarning({ 
  duplicates = [],
  onView,
  onIgnore 
}) {
  if (duplicates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Alert variant="warning" className="border-amber-200 bg-amber-50">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <AlertDescription className="ml-2">
          <div className="space-y-2">
            <p className="text-sm text-amber-900 font-medium">
              {duplicates.length === 1 
                ? 'Mögliches Duplikat gefunden'
                : `${duplicates.length} mögliche Duplikate gefunden`
              }
            </p>
            <p className="text-xs text-amber-700">
              Es existieren bereits ähnliche Einträge. Möchten Sie diese überprüfen?
            </p>
            <div className="flex gap-2 mt-2">
              {duplicates.slice(0, 3).map((duplicate, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => onView?.(duplicate)}
                  className="gap-2 bg-white"
                >
                  <Eye className="w-3 h-3" />
                  {duplicate.name || duplicate.title || `Eintrag ${idx + 1}`}
                </Button>
              ))}
              {duplicates.length > 3 && (
                <span className="text-xs text-amber-700 self-center">
                  +{duplicates.length - 3} weitere
                </span>
              )}
            </div>
            {onIgnore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onIgnore}
                className="text-amber-700 hover:text-amber-900"
              >
                Ignorieren und fortfahren
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}