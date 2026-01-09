import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, DollarSign } from 'lucide-react';

export default function BuildingContractsOverview({ contracts }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    terminated: 'bg-red-100 text-red-800',
    expired: 'bg-slate-100 text-slate-800'
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light text-slate-900">Mietverträge</h2>
      
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine Verträge vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map(contract => (
            <Card key={contract.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Vertrag #{contract.id.slice(0, 8)}</h3>
                  </div>
                  <Badge className={statusColors[contract.status]}>
                    {contract.status === 'active' ? 'Aktiv' : contract.status === 'terminated' ? 'Beendet' : 'Abgelaufen'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Beginn
                    </p>
                    <p className="font-semibold">{new Date(contract.start_date).toLocaleDateString('de-DE')}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ende
                    </p>
                    <p className="font-semibold">
                      {contract.is_unlimited ? 'Unbefristet' : new Date(contract.end_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Kaltmiete
                    </p>
                    <p className="font-semibold text-blue-600">{contract.base_rent}€</p>
                  </div>
                  <div>
                    <p className="text-slate-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Warmmiete
                    </p>
                    <p className="font-semibold text-blue-600">{contract.total_rent}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}