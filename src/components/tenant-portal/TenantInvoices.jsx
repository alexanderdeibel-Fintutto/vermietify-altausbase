import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TenantInvoices({ tenantId }) {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['tenantInvoices', tenantId],
    queryFn: async () => {
      const docs = await base44.entities.GeneratedDocument.filter({
        tenant_id: tenantId,
        document_type: 'mietvertrag'
      });
      return docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  if (isLoading) return <div className="text-center py-8">Lädt...</div>;

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-slate-500">
          Keine Rechnungen vorhanden
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {invoice.document_data?.invoiceNumber}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Ausgestellt: {format(new Date(invoice.created_date), 'dd. MMMM yyyy', { locale: de })}
                </p>
              </div>
              <Badge variant={
                invoice.document_data?.paymentStatus === 'paid' ? 'default' : 'destructive'
              }>
                {invoice.document_data?.paymentStatus === 'paid' ? 'Bezahlt' : 'Offen'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-slate-500">Fälligkeit</p>
                <p className="font-semibold">
                  {format(new Date(invoice.document_data?.dueDate), 'dd. MMMM yyyy', { locale: de })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Gesamtbetrag</p>
                <p className="text-2xl font-bold text-slate-900">
                  {invoice.document_data?.amount?.toFixed(2)}€
                </p>
              </div>
            </div>

            {invoice.document_data?.baseRent && (
              <div className="space-y-1 text-sm mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-slate-600">Kaltmiete:</span>
                  <span>{invoice.document_data.baseRent.toFixed(2)}€</span>
                </div>
                {invoice.document_data?.utilities > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nebenkosten:</span>
                    <span>{invoice.document_data.utilities.toFixed(2)}€</span>
                  </div>
                )}
                {invoice.document_data?.heating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Heizkosten:</span>
                    <span>{invoice.document_data.heating.toFixed(2)}€</span>
                  </div>
                )}
              </div>
            )}

            {invoice.document_data?.paymentStatus !== 'paid' && (
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm mb-4">
                <AlertCircle className="w-4 h-4" />
                Zahlung ausstehend
              </div>
            )}

            <Button variant="outline" className="w-full gap-2">
              <Download className="w-4 h-4" />
              PDF herunterladen
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}