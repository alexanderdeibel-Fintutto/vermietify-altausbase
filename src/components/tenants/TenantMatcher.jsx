import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';

export default function TenantMatcher({ unit, tenants, onSelect }) {
  if (!unit || !tenants.length) return null;

  // Smart matching: same building, active status, no existing tenant
  const matches = tenants
    .filter(t => 
      t.aktiv && 
      !unit.current_tenant_id &&
      (t.building_id === unit.building_id || !t.building_id)
    )
    .slice(0, 3);

  if (matches.length === 0) return null;

  return (
    <Card className="p-4 bg-blue-50 border-blue-200 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        <p className="font-medium text-sm text-blue-900">Mögliche Mieter für {unit.unit_number}</p>
      </div>

      <div className="space-y-2">
        {matches.map(tenant => (
          <div key={tenant.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
            <div>
              <p className="text-sm font-medium">{tenant.first_name} {tenant.last_name}</p>
              <p className="text-xs text-slate-500">{tenant.email}</p>
            </div>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 gap-1"
              onClick={() => onSelect(tenant)}
            >
              <Check className="w-3 h-3" />
              Zuordnen
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}