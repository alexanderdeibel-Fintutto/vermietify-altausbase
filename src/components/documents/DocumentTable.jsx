import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentTable({ documents, onDownload, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Typ</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Größe</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Hochgeladen</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {documents?.map((doc, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-indigo-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" />{doc.name}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{doc.type || 'PDF'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{doc.created_date ? format(new Date(doc.created_date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => onDownload?.(doc)}><Download className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => onDelete?.(doc)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}