import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Car, CheckCircle, XCircle } from 'lucide-react';

export default function ParkingManagement({ buildingId }) {
  const { data: units = [] } = useQuery({
    queryKey: ['units', buildingId],
    queryFn: () => base44.entities.Unit.filter(
      buildingId ? { building_id: buildingId } : {},
      'unit_number',
      100
    )
  });

  const parkingSpaces = units.map(unit => ({
    number: unit.parking_spaces?.[0] || `P-${unit.unit_number}`,
    unit: unit.unit_number,
    occupied: unit.current_tenant_id,
    tenant_name: unit.tenant_name || '-'
  }));

  const totalSpaces = parkingSpaces.length;
  const occupiedSpaces = parkingSpaces.filter(p => p.occupied).length;
  const freeSpaces = totalSpaces - occupiedSpaces;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Car className="w-4 h-4" />
          Parkplätze
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-slate-50 rounded text-center">
            <p className="text-xs text-slate-600">Gesamt</p>
            <p className="text-xl font-bold">{totalSpaces}</p>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <p className="text-xs text-green-900">Frei</p>
            <p className="text-xl font-bold text-green-900">{freeSpaces}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded text-center">
            <p className="text-xs text-blue-900">Belegt</p>
            <p className="text-xl font-bold text-blue-900">{occupiedSpaces}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {parkingSpaces.slice(0, 12).map((space, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border-2 text-center ${
                space.occupied 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-green-600 bg-green-50'
              }`}
            >
              <p className="text-xs font-bold">{space.number}</p>
              {space.occupied ? (
                <CheckCircle className="w-3 h-3 text-blue-600 mx-auto mt-1" />
              ) : (
                <XCircle className="w-3 h-3 text-green-600 mx-auto mt-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}