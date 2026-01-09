import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

export default function ContractRenewalTracker({ contractId }) {
  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ id: contractId }, null, 1);
      return contracts[0];
    },
    enabled: !!contractId
  });

  if (!contract) return null;

  const endDate = new Date(contract.end_date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry < 0;
  const isUnlimited = contract.is_unlimited;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Vertragslaufzeit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600">Beginn</p>
            <p className="font-semibold">{new Date(contract.start_date).toLocaleDateString('de-DE')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Ende</p>
            <p className="font-semibold">
              {isUnlimited ? 'Unbefristet' : new Date(contract.end_date).toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>

        {!isUnlimited && (
          <div className="pt-3 border-t">
            {isExpired ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Vertrag abgelaufen</p>
                  <p className="text-xs text-red-700">Vor {Math.abs(daysUntilExpiry)} Tagen</p>
                </div>
              </div>
            ) : isExpiringSoon ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Läuft bald aus</p>
                  <p className="text-xs text-amber-700">Noch {daysUntilExpiry} Tage</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Aktiv</p>
                  <p className="text-xs text-green-700">Noch {daysUntilExpiry} Tage</p>
                </div>
              </div>
            )}
          </div>
        )}

        {contract.notice_period_months && (
          <div className="pt-3 border-t">
            <p className="text-xs text-slate-600">Kündigungsfrist</p>
            <p className="font-semibold">{contract.notice_period_months} Monat(e)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}