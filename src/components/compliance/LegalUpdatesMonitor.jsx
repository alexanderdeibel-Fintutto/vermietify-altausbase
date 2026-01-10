import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, FileText } from 'lucide-react';

export default function LegalUpdatesMonitor() {
  const { data: updates = [] } = useQuery({
    queryKey: ['legalUpdates'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getLegalUpdates', {});
      return response.data.updates;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Rechtliche Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {updates.map((update, idx) => (
          <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{update.title}</p>
                <p className="text-xs text-slate-600 mt-1">{update.description}</p>
                <Badge className="mt-2 text-xs bg-orange-600">{update.effective_date}</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}