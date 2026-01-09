import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Calendar, AlertCircle } from 'lucide-react';

export default function MyLeasesWidget({ tenantId }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantLeases', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }, '-start_date', 10)
  });

  const activeContract = contracts.find(c => c.status === 'active');
  
  const getDaysUntilRenewal = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isRenewalSoon = activeContract && !activeContract.is_unlimited && getDaysUntilRenewal(activeContract.end_date) <= 90;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Meine Mietverträge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeContract ? (
          <p className="text-sm text-slate-600">Kein aktiver Mietvertrag</p>
        ) : (
          <>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">Aktueller Vertrag</p>
                <Badge className="bg-green-600">Aktiv</Badge>
              </div>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Miete:</span>
                  <span className="font-semibold">{activeContract.total_rent?.toLocaleString('de-DE')}€/Monat</span>
                </div>
                <div className="flex justify-between">
                  <span>Vertragsbeginn:</span>
                  <span>{new Date(activeContract.start_date).toLocaleDateString('de-DE')}</span>
                </div>
                {!activeContract.is_unlimited && (
                  <div className="flex justify-between">
                    <span>Vertragsende:</span>
                    <span>{new Date(activeContract.end_date).toLocaleDateString('de-DE')}</span>
                  </div>
                )}
                {activeContract.is_unlimited && (
                  <div className="flex justify-between">
                    <span>Laufzeit:</span>
                    <span className="text-blue-600 font-semibold">Unbefristet</span>
                  </div>
                )}
              </div>
            </div>

            {isRenewalSoon && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-900 mb-1">Verlängerung erforderlich</p>
                  <p className="text-xs text-amber-700">
                    Ihr Vertrag läuft in {getDaysUntilRenewal(activeContract.end_date)} Tagen ab. 
                    Bitte kontaktieren Sie uns zur Verlängerung.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span className="text-slate-600">Fälligkeit: {activeContract.rent_due_day}. des Monats</span>
              </div>
              {activeContract.notice_period_months && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-600">Kündigungsfrist: {activeContract.notice_period_months} Monate</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}