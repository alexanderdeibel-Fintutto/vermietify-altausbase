import React from 'react';
import { Zap, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BuildingTable({ stats, onEdit, onDelete, onQuickAction }) {
  const getOccupancyColor = (occupancy) => {
    if (occupancy === 100) return 'text-green-600';
    if (occupancy > 50) return 'text-amber-600';
    return 'text-slate-400';
  };

  const getOccupancyDot = (occupancy) => {
    if (occupancy === 100) return '●';
    if (occupancy > 50) return '◐';
    return '○';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 w-1/4">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 w-1/6 hidden md:table-cell">Ort</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 w-1/6">Einheiten</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 w-1/6">Auslast.</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-700 w-1/6">Ertrag</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-slate-700 w-1/6">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr
              key={stat.building.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer h-7"
              onClick={() => onEdit(stat.building)}
            >
              <td className="px-4 py-2 text-sm font-normal text-slate-900">{stat.building.name}</td>
              <td className="px-4 py-2 text-sm text-slate-600 hidden md:table-cell">{stat.building.city}</td>
              <td className="px-4 py-2 text-sm text-slate-900">
                {stat.rentedUnits}/{stat.totalUnits}
              </td>
              <td className={`px-4 py-2 text-sm font-normal ${getOccupancyColor(stat.occupancy)}`}>
                <span className="mr-1">{getOccupancyDot(stat.occupancy)}</span>
                {stat.occupancy}%
              </td>
              <td className="px-4 py-2 text-sm font-normal text-slate-900">
                €{stat.totalRent.toLocaleString('de-DE')}
              </td>
              <td className="px-4 py-2 text-right">
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onQuickAction(stat.building)}
                    title="Schnell-Status"
                  >
                    <Zap className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => onEdit(stat.building)}
                    title="Bearbeiten"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:text-red-600"
                    onClick={() => onDelete(stat.building)}
                    title="Löschen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}