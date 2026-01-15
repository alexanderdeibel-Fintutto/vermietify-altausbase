import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Clock, CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function RentPaymentTracker() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);

  const { data: payments = [], refetch } = useQuery({
    queryKey: ['rentPayments', selectedMonth],
    queryFn: async () => {
      const all = await base44.entities.RentPayment.list();
      return all.filter(p => p.payment_month === selectedMonth);
    }
  });

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'PAID').length,
    overdue: payments.filter(p => p.status === 'OVERDUE').length,
    open: payments.filter(p => p.status === 'OPEN').length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.paid_amount, 0)
  };

  const handleReminder = async (paymentId, reminderLevel) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateRentReminder', {
        rentPaymentId: paymentId,
        reminderLevel
      });

      toast.success(`Mahnung Level ${reminderLevel} generiert`);
      refetch();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mieteingang-Verfolgung</h1>
        <p className="text-gray-600 mt-1">Überwachung und Verfolgung aller Mieteinzahlungen</p>
      </div>

      {/* Month Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Monat auswählen</label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full md:w-48"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">Gesamt</p>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">€{stats.totalAmount.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <p className="text-xs text-green-700">Bezahlt</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-xs text-green-600">€{stats.paidAmount.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-xs text-yellow-700">Offen</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <p className="text-xs text-red-700">Überfällig</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-gray-600">Quote</p>
            <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Zahlungsübersicht</h2>
        {payments.length > 0 ? (
          payments.map(payment => {
            const isOverdue = new Date(payment.due_date) < new Date() && payment.status !== 'PAID';
            const daysOverdue = isOverdue 
              ? Math.floor((new Date() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24))
              : 0;

            return (
              <Card key={payment.id} className={isOverdue ? 'bg-red-50 border-red-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{payment.tenant_email}</p>
                        {payment.status === 'PAID' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {isOverdue && <AlertCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <p className="text-xs text-gray-600">
                        Fällig: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                        {isOverdue && ` • ${daysOverdue} Tage überfällig`}
                      </p>
                    </div>

                    <div className="text-right mr-4">
                      <p className="font-semibold">€{payment.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">
                        {payment.status === 'PAID' ? '✓ Bezahlt' : 'Ausstehend'}
                      </p>
                    </div>

                    {payment.status !== 'PAID' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReminder(payment.id, 1)}
                          disabled={loading || payment.reminders_sent > 0}
                          title="Zahlungserinnerung"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReminder(payment.id, 2)}
                          disabled={loading || payment.reminders_sent < 1}
                          title="Erste Mahnung"
                        >
                          1️⃣
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReminder(payment.id, 3)}
                          disabled={loading || payment.reminders_sent < 2}
                          title="Zweite Mahnung"
                        >
                          2️⃣
                        </Button>
                      </div>
                    )}
                  </div>

                  {payment.reminders_sent > 0 && (
                    <p className="text-xs text-amber-700 mt-2">
                      {payment.reminders_sent} Mahnung(en) versendet
                      {payment.last_reminder_date && ` • Letzter: ${new Date(payment.last_reminder_date).toLocaleDateString('de-DE')}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              Keine Zahlungen für {selectedMonth} erfasst
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}