import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PaymentReceiptViewer({ tenantId }) {
  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const results = await base44.entities.Payment.filter(
        { tenant_id: tenantId, status: 'completed' },
        '-payment_date',
        20
      );
      return results;
    },
    enabled: !!tenantId,
  });

  const handleDownloadReceipt = async (payment) => {
    try {
      const response = await base44.functions.invoke('generatePaymentReceipt', {
        payment_id: payment.id,
      });
      
      const link = document.createElement('a');
      link.href = response.data.receipt_url;
      link.download = `receipt_${payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Fehler beim Download:', error);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-light text-slate-900">Zahlungsquittungen</h3>
        <p className="text-sm font-light text-slate-600 mt-1">
          Ihre bisherigen Zahlungen herunterladen
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {payments.length === 0 ? (
          <p className="text-sm font-light text-slate-500 py-4 text-center">
            Keine Zahlungen vorhanden
          </p>
        ) : (
          payments.map(payment => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-light text-slate-900">
                    €{payment.amount?.toFixed(2)}
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    Bezahlt
                  </Badge>
                </div>
                <p className="text-xs font-light text-slate-500">
                  {format(new Date(payment.payment_date), 'dd.MM.yyyy', { locale: de })}
                </p>
                {payment.description && (
                  <p className="text-xs font-light text-slate-600 mt-1">
                    {payment.description}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownloadReceipt(payment)}
                className="gap-2 font-light"
              >
                <Download className="w-4 h-4" />
                Quittung
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}