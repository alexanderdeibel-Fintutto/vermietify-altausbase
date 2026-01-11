import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';

export default function HeritageProtectionTracker({ companyId }) {
  const { data: protections = [] } = useQuery({
    queryKey: ['heritage-protections', companyId],
    queryFn: () => base44.asServiceRole.entities.HeritageProtection.filter({ company_id: companyId })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Denkmalschutz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {protections.map(protection => (
          <div key={protection.id} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {protection.protection_status === 'listed' ? 'Denkmalgeschützt' : 
                 protection.protection_status === 'ensemble_protected' ? 'Ensembleschutz' : 'Kein Schutz'}
              </span>
              {protection.registration_number && (
                <Badge>Nr. {protection.registration_number}</Badge>
              )}
            </div>
            <div className="text-xs space-y-1">
              <p>Behörde: {protection.authority}</p>
              {protection.tax_benefits?.afa_rate && (
                <p className="text-green-600">AfA: {protection.tax_benefits.afa_rate}%</p>
              )}
              {protection.restrictions?.length > 0 && (
                <p className="text-slate-600">{protection.restrictions.length} Auflagen</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}