import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Calendar, DollarSign, Home, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function LeaseDetailsCard({ tenantId }) {
  const { data: leaseContract, isLoading } = useQuery({
    queryKey: ['leaseContract', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const results = await base44.entities.LeaseContract.filter(
        { tenant_id: tenantId },
        '-created_date',
        1
      );
      return results[0];
    },
    enabled: !!tenantId,
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', leaseContract?.unit_id],
    queryFn: () => base44.entities.Unit.read(leaseContract?.unit_id),
    enabled: !!leaseContract?.unit_id,
  });

  if (isLoading) {
    return <div className="h-48 bg-slate-100 rounded-lg animate-pulse" />;
  }

  if (!leaseContract) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <p className="text-sm font-light text-slate-600">Kein aktiver Mietvertrag gefunden</p>
        </div>
      </Card>
    );
  }

  const startDate = new Date(leaseContract.start_date);
  const endDate = new Date(leaseContract.end_date);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-light text-slate-900">Mietvertragsdetails</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Home className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-light text-slate-500 uppercase">Einheit</p>
            <p className="text-sm font-light text-slate-900 mt-0.5">
              {unit?.name || leaseContract.unit_id}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DollarSign className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-light text-slate-500 uppercase">Miete</p>
            <p className="text-sm font-light text-slate-900 mt-0.5">
              €{leaseContract.monthly_rent?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-light text-slate-500 uppercase">Von</p>
            <p className="text-sm font-light text-slate-900 mt-0.5">
              {format(startDate, 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-xs font-light text-slate-500 uppercase">Bis</p>
            <p className={`text-sm font-light mt-0.5 ${daysUntilEnd < 90 ? 'text-amber-600' : 'text-slate-900'}`}>
              {format(endDate, 'dd.MM.yyyy', { locale: de })}
            </p>
            {daysUntilEnd < 90 && (
              <p className="text-xs font-light text-amber-600 mt-1">
                {daysUntilEnd} Tage verbleibend
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-light">
            <span className="text-slate-600">Kaution:</span>
            <span className="text-slate-900">
              €{leaseContract.deposit?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-sm font-light">
            <span className="text-slate-600">Vertrag-Nr:</span>
            <span className="text-slate-900">{leaseContract.contract_number}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}