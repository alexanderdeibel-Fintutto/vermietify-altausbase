import React from 'react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import { Eye } from 'lucide-react';

export default function UnitTable({ units = [], onView }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Einheit</th>
            <th>Typ</th>
            <th>Fläche</th>
            <th>Zimmer</th>
            <th>Miete</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.id}>
              <td className="font-medium">{unit.unit_number || unit.name}</td>
              <td>{unit.unit_type || 'Wohnung'}</td>
              <td>{unit.living_area ? `${unit.living_area} m²` : '-'}</td>
              <td>{unit.rooms || '-'}</td>
              <td>
                <CurrencyDisplay amount={unit.rent_cold || 0} />
              </td>
              <td>
                <StatusBadge status={unit.status || 'vacant'} />
              </td>
              <td className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(unit)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}