import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TenantPaymentStatus({ tenantId }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['tenantPayments', tenantId],
    queryFn: async () => {
      const payments = await base44.entities.Payment.filter({
        tenant_id: tenantId
      });
      return payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    }
  });

  const { data: overdueInvoices } = useQuery({
    queryKey: ['overdueInvoices', tenantId],
    queryFn: async () => {
      const invoices = await base44.entities.GeneratedDocument.filter({
        tenant_id: tenantId,
        distribution_status: 'generated'
      });
      return invoices.filter(inv => {
        const dueDate = new Date(inv.document_data?.dueDate);
        return dueDate < new Date();
      });
    }
  });

  if (isLoading) return <div className="text-center py-8">Lädt...</div>;

  const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const totalDue = overdueInvoices?.reduce((sum, inv) => sum + (inv.document_data?.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Bezahlte Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{totalPaid.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Offene Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{totalDue.toFixed(2)}€</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Letzte Zahlung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {payments && payments[0] ? 
                format(new Date(payments[0].payment_date), 'dd. MMM yyyy', { locale: de })
                : '-'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Offene Rechnungen */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Offene Zahlungen ({overdueInvoices.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-white rounded border border-red-200">
                  <div>
                    <p className="font-semibold">{invoice.document_data?.invoiceNumber}</p>
                    <p className="text-sm text-slate-600">
                      Fällig: {format(new Date(invoice.document_data?.dueDate), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-red-600">{invoice.document_data?.amount?.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Zahlungshistorie */}
      {payments && payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Zahlungshistorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payments.map((payment, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold">
                      {format(new Date(payment.payment_date), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                    <p className="text-sm text-slate-600">{payment.payment_method || 'Überweisung'}</p>
                  </div>
                  <p className="font-semibold text-green-600">+{payment.amount?.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}