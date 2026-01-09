import React from 'react';
import { Home, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function UnitTable({ units, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Einheit</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gebäude</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fläche</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Miete</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {units?.map((unit, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-sky-50 transition-colors cursor-pointer" onClick={() => onEdit?.(unit)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><Home className="w-4 h-4 text-sky-600" />{unit.unit_number || unit.name || `Wohnung ${idx + 1}`}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{unit.building_name || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{unit.sqm || unit.area || '—'} m² / {unit.rooms || '—'} Zi.</td>
              <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${unit.status === 'occupied' ? 'bg-green-100 text-green-700' : unit.status === 'renovation' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{unit.status === 'occupied' ? 'Vermietet' : unit.status === 'renovation' ? 'Renovierung' : 'Verfügbar'}</span></td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(unit.base_rent || unit.rent || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(unit); }}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(unit); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}