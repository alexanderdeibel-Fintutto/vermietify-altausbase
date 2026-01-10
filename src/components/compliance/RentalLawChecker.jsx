import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function RentalLawChecker({ contractId }) {
  const { data: check } = useQuery({
    queryKey: ['lawCheck', contractId],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkRentalLawCompliance', { contract_id: contractId });
      return response.data;
    },
    enabled: !!contractId
  });

  if (!check) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Mietrechts-Prüfung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {check.issues.map((issue, idx) => (
          <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{issue.title}</p>
                <p className="text-xs text-slate-600">{issue.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
        {check.issues.length === 0 && (
          <Badge className="bg-green-600">Rechtlich konform</Badge>
        )}
      </CardContent>
    </Card>
  );
}