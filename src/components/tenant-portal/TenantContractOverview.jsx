import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Euro, MapPin } from 'lucide-react';

export default function TenantContractOverview({ tenantId }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['tenant-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId })
  });

  const { data: units } = useQuery({
    queryKey: ['contract-units', contracts.map(c => c.unit_id)],
    queryFn: async () => {
      const unitIds = contracts.map(c => c.unit_id).filter(Boolean);
      if (unitIds.length === 0) return [];
      return Promise.all(unitIds.map(id => base44.entities.Unit.read(id)));
    },
    enabled: contracts.length > 0
  });

  const activeContract = contracts.find(c => c.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Mein Mietvertrag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeContract ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Vertragsnummer</p>
                <p className="font-medium">{activeContract.id.substring(0, 8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Vertragsbeginn</span>
                </div>
                <p className="font-medium">{new Date(activeContract.start_date).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Vertragsende</span>
                </div>
                <p className="font-medium">{new Date(activeContract.end_date).toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Euro className="w-4 h-4" />
                <span className="text-sm">Mietkosten</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Kaltmiete</span>
                  <span className="font-medium">{activeContract.monthly_rent}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nebenkosten-Vorauszahlung</span>
                  <span className="font-medium">{activeContract.utility_advance}€</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Gesamtmiete</span>
                  <span>{(parseFloat(activeContract.monthly_rent) + parseFloat(activeContract.utility_advance)).toFixed(2)}€</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-slate-600 py-4">Kein aktiver Mietvertrag gefunden</p>
        )}
      </CardContent>
    </Card>
  );
}