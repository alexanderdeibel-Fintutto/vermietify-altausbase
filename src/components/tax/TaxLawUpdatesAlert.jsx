import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TaxLawUpdatesAlert({ country, maxItems = 3 }) {
  const { data: updates, isLoading } = useQuery({
    queryKey: ['taxLawUpdates', country],
    queryFn: async () => {
      const allUpdates = await base44.entities.TaxLawUpdate.filter(
        { country, is_active: true },
        '-effective_date',
        maxItems
      ) || [];
      return allUpdates.filter(u => new Date(u.effective_date) > new Date());
    },
    enabled: !!country
  });

  if (isLoading || !updates || updates.length === 0) {
    return null;
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  return (
    <div className="space-y-2">
      {updates.map((update) => (
        <Alert key={update.id} className={`border-2 ${impactColors[update.impact_level]}`}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold">{update.title}</h4>
                <p className="text-sm mt-1">{update.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">Gültig ab {update.effective_date}</Badge>
                  <Badge variant="outline" className="text-xs">{update.category}</Badge>
                </div>
              </div>
              <Badge className={impactColors[update.impact_level]}>
                {update.impact_level === 'high' ? '🔴' : update.impact_level === 'medium' ? '🟡' : '🔵'} Auswirkung
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}