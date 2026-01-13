import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DuplicateWarning({ 
  entityType, 
  fieldValue, 
  fieldName = 'name',
  onClose,
  excludeId = null
}) {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fieldValue || fieldValue.length < 3) {
      setDuplicates([]);
      return;
    }

    const checkDuplicates = async () => {
      setLoading(true);
      try {
        const query = {
          [fieldName]: fieldValue
        };
        if (excludeId) {
          query.id = { $ne: excludeId };
        }

        const results = await base44.entities[entityType].filter(query);
        setDuplicates(results);
      } catch (error) {
        console.error('Error checking duplicates:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(checkDuplicates, 500);
    return () => clearTimeout(timer);
  }, [fieldValue, fieldName, entityType, excludeId]);

  if (duplicates.length === 0 || loading) {
    return null;
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">⚠️ Mögliche Duplikate gefunden</p>
            <p className="text-xs mt-1">
              {duplicates.length} existierende {entityType} mit diesem Namen
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-yellow-700 hover:text-yellow-900"
          >
            ×
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}