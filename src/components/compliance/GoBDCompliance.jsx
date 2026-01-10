import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldCheck } from 'lucide-react';

export default function GoBDCompliance() {
  const { data: status } = useQuery({
    queryKey: ['goBDStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('checkGoBDCompliance', {});
      return response.data;
    }
  });

  if (!status) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          GoBD-Konformität
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Gesamtstatus</span>
          <Badge className={status.compliant ? 'bg-green-600' : 'bg-red-600'}>
            {status.compliant ? 'Konform' : 'Nicht konform'}
          </Badge>
        </div>
        <Progress value={status.compliance_score} />
        <div className="space-y-2">
          {status.checks.map((check, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span>{check.name}</span>
              <Badge variant={check.passed ? 'default' : 'destructive'} className="text-xs">
                {check.passed ? '✓' : '✗'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}