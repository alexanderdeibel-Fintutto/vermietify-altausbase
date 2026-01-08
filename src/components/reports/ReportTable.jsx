import React from 'react';
import { Download, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportTable({ reports, onView, onDownload, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Typ</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Erstellt</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {reports?.map((report, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-rose-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.name || 'Report'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{report.type || 'Finanzbericht'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{report.created_date ? format(new Date(report.created_date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4 text-sm"><span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Fertig</span></td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => onView?.(report)}><Eye className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDownload?.(report)}><Download className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(report)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}