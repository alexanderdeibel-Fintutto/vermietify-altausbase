import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Home, Users } from 'lucide-react';

export default function BuildingSummary({ building, units = [], tenants = [] }) {
  const occupiedUnits = units.filter(u => tenants.some(t => t.unit_id === u.id));
  const occupancyRate = units.length > 0 ? Math.round((occupiedUnits.length / units.length) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--vf-primary-600)] to-[var(--vf-accent-500)] rounded-lg flex items-center justify-center">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{building?.adresse || 'Objekt'}</h3>
            <p className="text-sm text-[var(--theme-text-secondary)] mb-4">
              {building?.plz} {building?.ort}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 text-[var(--theme-text-muted)] mb-1">
                  <Home className="h-4 w-4" />
                  <span className="text-xs">Einheiten</span>
                </div>
                <div className="text-xl font-bold">{units.length}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[var(--theme-text-muted)] mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Mieter</span>
                </div>
                <div className="text-xl font-bold">{tenants.length}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--theme-text-muted)] mb-1">Auslastung</div>
                <div className="text-xl font-bold">{occupancyRate}%</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}