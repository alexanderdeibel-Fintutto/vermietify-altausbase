import React from 'react';
import { DollarSign, Edit, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CostTypeTable({ costTypes, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kategorie</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Umlagesfähig</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Steuerlich</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {costTypes?.map((type, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => onEdit?.(type)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-indigo-600" />{type.name || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{type.category || '—'}</td>
              <td className="px-6 py-4 text-sm">{type.allocatable ? <Check className="w-4 h-4 text-green-600" /> : <span className="text-slate-400">—</span>}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{type.tax_treatment || '—'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(type); }}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(type); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}