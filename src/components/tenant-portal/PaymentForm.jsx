import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function PaymentForm({ tenantId, pendingInvoices }) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [status, setStatus] = useState(null);

  const paymentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('processStripePayment', data);
      return response.data;
    },
    onSuccess: (data) => {
      setStatus({ type: 'success', message: 'Zahlung erfolgreich eingeleitet!' });
      setTimeout(() => {
        window.location.href = data.checkout_url;
      }, 1500);
    },
    onError: (error) => {
      setStatus({ type: 'error', message: error.message || 'Zahlungsfehler' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedInvoiceId && !customAmount) {
      setStatus({ type: 'error', message: 'Bitte wählen Sie eine Rechnung oder einen Betrag' });
      return;
    }

    const selectedInvoice = pendingInvoices?.find(inv => inv.id === selectedInvoiceId);
    const amount = selectedInvoice?.total_amount || parseFloat(customAmount);

    if (!amount || amount <= 0) {
      setStatus({ type: 'error', message: 'Ungültiger Zahlungsbetrag' });
      return;
    }

    paymentMutation.mutate({
      tenant_id: tenantId,
      invoice_id: selectedInvoiceId,
      amount: Math.round(amount * 100),
      description: selectedInvoice?.invoice_number || 'Mietzahlung',
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-light text-slate-900">Zahlung tätigen</h3>
        <p className="text-sm font-light text-slate-600 mt-1">
          Bezahlen Sie Ihre Miete und Gebühren sicher online
        </p>
      </div>

      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <p className={`text-sm font-light ${
            status.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {status.message}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-light text-slate-700">Zu zahlende Rechnung</label>
          <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wählen Sie eine Rechnung..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Manuellen Betrag eingeben</SelectItem>
              {pendingInvoices?.map(invoice => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - €{invoice.total_amount?.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedInvoiceId && (
          <div>
            <label className="text-sm font-light text-slate-700">Zahlungsbetrag (€)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="mt-1 font-light"
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={paymentMutation.isPending}
          className="w-full bg-slate-900 hover:bg-slate-800 font-light"
        >
          {paymentMutation.isPending ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Wird verarbeitet...
            </>
          ) : (
            'Zur Zahlung'
          )}
        </Button>
      </form>

      <div className="text-xs font-light text-slate-500 text-center">
        🔒 Sichere Zahlung mit Stripe
      </div>
    </Card>
  );
}