import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';

export default function OperatingCostWizardStep2({ buildingId, onNext, selected }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', buildingId],
    queryFn: async () => {
      const all = await base44.entities.LeaseContract.list();
      return all.filter(c => c.building_id === buildingId);
    },
    enabled: !!buildingId
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Mietverträge auswählen</h2>
        <p className="text-sm text-slate-600">Welche Verträge sollen in dieser Abrechnung erfasst werden?</p>
      </div>

      <div className="grid gap-3">
        {contracts.map(contract => (
          <Card 
            key={contract.id}
            className={`cursor-pointer transition-all ${selected.some(s => s.id === contract.id) ? 'border-2 border-emerald-500 bg-emerald-50' : 'hover:border-slate-300'}`}
            onClick={() => {
              const updated = selected.some(s => s.id === contract.id)
                ? selected.filter(s => s.id !== contract.id)
                : [...selected, contract];
              onNext(updated);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{contract.tenant_name || 'Unbekannter Mieter'}</p>
                    {selected.some(s => s.id === contract.id) && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-slate-600">
                    <span>€{contract.rent_amount?.toFixed(2)}/Monat</span>
                    {contract.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        ab {format(parseISO(contract.start_date), 'dd.MM.yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={contract.active ? 'default' : 'secondary'}>
                  {contract.active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contracts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Keine Mietverträge für dieses Gebäude vorhanden.
        </div>
      )}
    </div>
  );
}