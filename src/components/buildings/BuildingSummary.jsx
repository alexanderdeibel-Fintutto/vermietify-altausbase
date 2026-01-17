import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Home, Euro } from 'lucide-react';

export default function BuildingSummary({ building, units = [], contracts = [] }) {
  const occupiedUnits = units.filter(u => 
    contracts.some(c => c.unit_id === u.id && c.status === 'active')
  );

  const totalRent = contracts
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.rent_cold || 0), 0);

  const occupancyRate = units.length > 0 
    ? Math.round((occupiedUnits.length / units.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Objektübersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-2xl font-bold mb-1">{building.name}</div>
            {building.address && (
              <div className="flex items-center gap-2 text-[var(--theme-text-muted)]">
                <MapPin className="h-4 w-4" />
                <span>{building.address}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Home className="h-5 w-5 mx-auto mb-1 text-[var(--theme-text-muted)]" />
              <div className="text-xl font-bold">{units.length}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">Einheiten</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--vf-success-600)]">{occupancyRate}%</div>
              <div className="text-xs text-[var(--theme-text-muted)]">Auslastung</div>
            </div>
            <div className="text-center">
              <Euro className="h-5 w-5 mx-auto mb-1 text-[var(--theme-text-muted)]" />
              <div className="text-xl font-bold">€{totalRent.toLocaleString()}</div>
              <div className="text-xs text-[var(--theme-text-muted)]">Miete/Monat</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}