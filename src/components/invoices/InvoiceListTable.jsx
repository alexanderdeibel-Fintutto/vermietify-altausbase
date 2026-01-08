import React from 'react';
import { Pencil, Trash2, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function InvoiceListTable({ invoices, onEdit, onDelete, onDownload }) {
  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      issued: 'bg-orange-100 text-orange-700',
      paid: 'bg-green-100 text-green-700',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nummer</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Empfänger</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Betrag</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Datum</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {invoices?.map((invoice, idx) => (
            <tr 
              key={idx}
              className="border-b border-slate-100 hover:bg-orange-50 transition-colors cursor-pointer"
              onClick={() => onEdit?.(invoice)}
            >
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{invoice.number || `INV-${idx + 1}`}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{invoice.recipient_name || '—'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(invoice.amount || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">
                {invoice.date ? format(new Date(invoice.date), 'dd.MM.yyyy', { locale: de }) : '—'}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {invoice.status === 'draft' && 'Entwurf'}
                  {invoice.status === 'issued' && 'Ausgestellt'}
                  {invoice.status === 'paid' && 'Bezahlt'}
                </span>
              </td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload?.(invoice);
                  }}
                  title="PDF herunterladen"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(invoice);
                  }}
                >
                  <Pencil className="w-4 h-4 text-slate-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(invoice);
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