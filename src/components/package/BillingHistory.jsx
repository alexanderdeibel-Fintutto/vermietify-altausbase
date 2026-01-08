import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: packageConfig } = useQuery({
    queryKey: ['user-package'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return null;
      const result = await base44.entities.UserPackageConfiguration.filter({ 
        user_id: user.id
      });
      return result[0];
    }
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('getStripeInvoices', {});
      setInvoices(response.data || []);
      if (!response.data || response.data.length === 0) {
        toast.info('Keine Rechnungen vorhanden');
      }
    } catch (error) {
      toast.error('Rechnungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await base44.functions.invoke('downloadStripePDF', {
        invoice_id: invoiceId
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('PDF-Download fehlgeschlagen');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (cents) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Rechnungen & Abos</h3>
        <Button
          onClick={loadInvoices}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Wird geladen...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Rechnungen laden
            </>
          )}
        </Button>
      </div>

      {/* Aktives Abo */}
      {packageConfig && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Aktives Abo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Paket:</span>
              <Badge className="bg-emerald-600">{packageConfig.package_type}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Monatliche Gebühr:</span>
              <span className="font-semibold">€{packageConfig.price_per_month?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">Status:</span>
              <Badge variant={packageConfig.is_active ? 'default' : 'destructive'}>
                {packageConfig.is_active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            {packageConfig.valid_until && (
              <div className="flex justify-between items-center">
                <span className="text-slate-700">Gültig bis:</span>
                <span className="text-slate-900">{formatDate(packageConfig.valid_until)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rechnungsverlauf */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rechnungsverlauf</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              Noch keine Rechnungen vorhanden
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{invoice.description}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(invoice.created)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {formatPrice(invoice.amount_paid)}
                    </span>
                    <Badge
                      variant={invoice.paid ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {invoice.paid ? 'Bezahlt' : 'Ausstehend'}
                    </Badge>
                    {invoice.invoice_pdf && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadInvoice(invoice.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}