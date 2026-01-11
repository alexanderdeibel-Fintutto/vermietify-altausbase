import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Euro, MapPin, User } from 'lucide-react';

export default function EnhancedContractView({ tenantId, contractId, unitId }) {
  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractId ? base44.entities.LeaseContract.read(contractId) : null,
    enabled: !!contractId
  });

  const { data: unit } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitId ? base44.entities.Unit.read(unitId) : null,
    enabled: !!unitId
  });

  const { data: building } = useQuery({
    queryKey: ['building', unit?.building_id],
    queryFn: () => unit?.building_id ? base44.entities.Building.read(unit.building_id) : null,
    enabled: !!unit?.building_id
  });

  if (!contract) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">Kein aktiver Mietvertrag gefunden</p>
        </CardContent>
      </Card>
    );
  }

  const contractDetails = [
    { icon: MapPin, label: 'Adresse', value: `${building?.address?.street}, ${building?.address?.city}` },
    { icon: User, label: 'Wohnung', value: unit?.unit_number },
    { icon: Calendar, label: 'Vertragsbeginn', value: new Date(contract.start_date).toLocaleDateString('de-DE') },
    { icon: Calendar, label: 'Vertragsende', value: contract.end_date ? new Date(contract.end_date).toLocaleDateString('de-DE') : 'Unbefristet' },
    { icon: Euro, label: 'Kaltmiete', value: `€${contract.rent_amount?.toFixed(2)}/Monat` },
    { icon: Euro, label: 'Nebenkosten', value: contract.utilities_advance ? `€${contract.utilities_advance.toFixed(2)}/Monat` : 'N/A' },
    { icon: Euro, label: 'Kaution', value: contract.deposit_amount ? `€${contract.deposit_amount.toFixed(2)}` : 'N/A' }
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Mein Mietvertrag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contractDetails.map((detail, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded">
              <detail.icon className="w-5 h-5 text-slate-600" />
              <div className="flex-1">
                <p className="text-xs text-slate-600">{detail.label}</p>
                <p className="font-medium">{detail.value}</p>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Badge className={contract.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
              {contract.status === 'active' ? 'Aktiv' : contract.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wichtige Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm font-medium text-blue-900 mb-1">Zahlungstermin</p>
            <p className="text-xs text-blue-700">Miete fällig am 1. des Monats</p>
          </div>
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-sm font-medium text-orange-900 mb-1">Kündigungsfrist</p>
            <p className="text-xs text-orange-700">
              {contract.notice_period_months || 3} Monate zum Monatsende
            </p>
          </div>
          {contract.notes && (
            <div className="p-3 bg-slate-50 border rounded">
              <p className="text-sm font-medium text-slate-900 mb-1">Hinweise</p>
              <p className="text-xs text-slate-700">{contract.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}