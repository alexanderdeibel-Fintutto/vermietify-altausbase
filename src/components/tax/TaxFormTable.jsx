import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TaxFormTable({ forms, onEdit, onDelete, onDownload }) {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      completed: 'bg-green-100 text-green-700',
      submitted: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Formular</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Jahr</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Gebäude</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {forms?.map((form, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-purple-50 transition-colors cursor-pointer" onClick={() => onEdit?.(form)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-purple-600" />{form.form_type || 'Anlage V'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{form.tax_year || '2026'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{form.building_name || '—'}</td>
              <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>{form.status === 'draft' ? 'Entwurf' : form.status === 'completed' ? 'Vollständig' : 'Eingereicht'}</span></td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDownload?.(form); }}><Download className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(form); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}