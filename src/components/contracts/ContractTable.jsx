import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ContractTable({ contracts, onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mieter</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Wohneinheit</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Miete</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {contracts?.map((contract, idx) => (
            <tr 
              key={idx}
              className="border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => onEdit?.(contract)}
            >
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{contract.tenant_name || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{contract.unit_name || '—'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(contract.rent_amount || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">
                {contract.start_date ? format(new Date(contract.start_date), 'dd.MM.yyyy', { locale: de }) : '—'}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Aktiv
                </span>
              </td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(contract);
                  }}
                >
                  <Pencil className="w-4 h-4 text-slate-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(contract);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}