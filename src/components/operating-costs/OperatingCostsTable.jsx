import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function OperatingCostsTable({ costs, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kategorie</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gebäude</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Betrag</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Datum</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {costs?.map((cost, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-amber-50 transition-colors cursor-pointer" onClick={() => onEdit?.(cost)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{cost.category || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{cost.building_name || '—'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(cost.amount || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{cost.date ? format(new Date(cost.date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(cost); }}><Pencil className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(cost); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}