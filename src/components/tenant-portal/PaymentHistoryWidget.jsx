import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-800',
  overdue: 'bg-red-100 text-red-800',
};

export default function PaymentHistoryWidget({ tenantId }) {
  const { data: invoices = [] } = useQuery({
    queryKey: ['tenant-invoices', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const results = await base44.entities.Invoice.filter(
        { tenant_id: tenantId },
        '-due_date',
        12
      );
      return results;
    },
    enabled: !!tenantId,
  });

  const upcomingInvoices = invoices.filter(inv => {
    const dueDate = new Date(inv.due_date);
    return dueDate >= new Date() && ['issued', 'overdue'].includes(inv.status);
  });

  const totalDue = upcomingInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-light text-slate-900">Zahlungshistorie & Fällige Rechnungen</h3>
      </div>

      {upcomingInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-light text-amber-900">
                Ausstehende Zahlungen: <strong>€{totalDue.toFixed(2)}</strong>
              </p>
              <p className="text-xs font-light text-amber-700 mt-1">
                {upcomingInvoices.length} Rechnung{upcomingInvoices.length !== 1 ? 'en' : ''} fällig
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {invoices.length === 0 ? (
          <p className="text-sm font-light text-slate-500 py-4 text-center">
            Keine Rechnungen vorhanden
          </p>
        ) : (
          invoices.slice(0, 8).map(invoice => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-light text-slate-900">
                    {invoice.invoice_number}
                  </p>
                </div>
                <p className="text-xs font-light text-slate-500 mt-1">
                  Fällig: {format(new Date(invoice.due_date), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-light text-slate-900 mb-1">
                  €{invoice.total_amount?.toFixed(2)}
                </p>
                <Badge className={statusColors[invoice.status]}>
                  {invoice.status === 'issued' && 'Offen'}
                  {invoice.status === 'paid' && 'Bezahlt'}
                  {invoice.status === 'overdue' && 'Überfällig'}
                  {invoice.status === 'cancelled' && 'Storniert'}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}