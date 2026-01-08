import React from 'react';
import { Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SupplierTable({ suppliers, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kategorie</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefon</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {suppliers?.map((supplier, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-lime-50 transition-colors cursor-pointer" onClick={() => onEdit?.(supplier)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{supplier.name || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{supplier.category || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4" />{supplier.phone || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4" />{supplier.email || '—'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(supplier); }}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(supplier); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}