import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RentalLawComplianceChecker({ companyId }) {
  const [buildingId, setBuildingId] = useState('');
  const queryClient = useQueryClient();

  const { data: checks = [] } = useQuery({
    queryKey: ['compliance-checks', companyId],
    queryFn: () => base44.asServiceRole.entities.ComplianceCheck.filter({ company_id: companyId }, '-check_date', 10)
  });

  const checkMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('checkRentalLawCompliance', { building_id: buildingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-checks'] });
      setBuildingId('');
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'violation': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Mietrechts-Compliance prüfen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Gebäude-ID"
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
          />
          <Button
            onClick={() => checkMutation.mutate()}
            disabled={!buildingId}
            className="w-full"
          >
            Compliance-Check starten
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {checks.map(check => (
          <Card key={check.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  <span className="text-sm font-medium">{check.check_date}</span>
                </div>
                <Badge variant={check.status === 'compliant' ? 'outline' : 'destructive'}>
                  {check.findings?.length || 0} Befunde
                </Badge>
              </div>
              {check.findings?.map((f, i) => (
                <div key={i} className="mt-2 p-2 bg-slate-50 rounded text-xs">
                  <p className="font-medium">{f.rule}</p>
                  <p className="text-slate-600">{f.description}</p>
                  <p className="text-blue-600 mt-1">→ {f.recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}