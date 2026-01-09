import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LeaseExpiryWidget({ tenantId }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-end_date', 5)
  });

  const activeContract = contracts.find(c => new Date(c.end_date) > new Date());
  
  if (!activeContract) return null;

  const daysUntilExpiry = Math.ceil((new Date(activeContract.end_date) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry <= 90;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-5 h-5" />
          Mietvertrag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isExpiringSoon && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">Vertrag läuft bald aus</p>
            </div>
            <p className="text-xs text-amber-700">Noch {daysUntilExpiry} Tage bis zum Vertragsende</p>
          </div>
        )}
        
        <div className="p-3 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-600 mb-2">Vertragsende</p>
          <p className="font-semibold text-slate-900">{new Date(activeContract.end_date).toLocaleDateString('de-DE')}</p>
          <Badge className="mt-2 bg-green-100 text-green-800">Aktiv</Badge>
        </div>
      </CardContent>
    </Card>
  );
}