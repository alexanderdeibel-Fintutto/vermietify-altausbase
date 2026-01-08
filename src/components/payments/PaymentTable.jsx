import React from 'react';
import { CheckCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PaymentTable({ payments, onEdit, onDelete }) {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return 'Abgeschlossen';
      case 'pending': return 'Ausstehend';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mieter</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Einheit</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Betrag</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fällig am</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {payments?.map((payment, idx) => (
            <tr key={idx} className="border-b border-slate-100 hover:bg-violet-50 transition-colors cursor-pointer" onClick={() => onEdit?.(payment)}>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">{payment.tenant_name || '—'}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{payment.unit_name || '—'}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">€{(payment.amount || 0).toFixed(2)}</td>
              <td className="px-6 py-4 text-sm text-slate-700">{payment.due_date ? format(new Date(payment.due_date), 'dd.MM.yyyy', { locale: de }) : '—'}</td>
              <td className="px-6 py-4 text-sm"><span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusBg(payment.status)}`}>{getStatusIcon(payment.status)} {getStatusLabel(payment.status)}</span></td>
              <td className="px-6 py-4 text-right flex gap-2 justify-end">
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit?.(payment); }}><Edit className="w-4 h-4 text-slate-600" /></Button>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete?.(payment); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}