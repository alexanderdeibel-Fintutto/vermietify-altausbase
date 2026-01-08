import React from 'react';
import { TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function FinancialItemTable({ items, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Beschreibung</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Typ</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gebäude</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Betrag</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Datum</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-fuchsia-50 transition-colors cursor-pointer" onClick={() => onEdit?.(item)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.description || '—'}</td>
              <td className="px-6 py-4 text-sm flex items-center gap-2">
                {item.type === 'income' ? (
                  <><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-green-700">Einnahme</span></>
                ) : (
                  <><TrendingDown className="w-4 h-4 text-red-600" /><span className="text-red-700">Ausgabe</span></>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-700">{item.building_name || '—'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(item.amount || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{item.date ? format(new Date(item.date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(item); }}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}