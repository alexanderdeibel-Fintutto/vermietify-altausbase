import React from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import TimeAgo from '@/components/shared/TimeAgo';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export default function EquipmentTable({ equipment = [], onView }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Bezeichnung</th>
            <th>Typ</th>
            <th>Standort</th>
            <th>Letzte Wartung</th>
            <th>Status</th>
            <th className="text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              <td className="font-medium">{item.name}</td>
              <td>{item.equipment_type}</td>
              <td>{item.location}</td>
              <td>
                {item.last_maintenance ? (
                  <TimeAgo date={item.last_maintenance} />
                ) : (
                  '-'
                )}
              </td>
              <td>
                <StatusBadge status={item.status || 'active'} />
              </td>
              <td className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(item)}>
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