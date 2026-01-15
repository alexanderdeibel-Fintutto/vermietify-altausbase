import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function RentCollectionDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.ActualPayment.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  // Filter for selected month
  const monthPayments = payments.filter(p => {
    const pDate = new Date(p.payment_date);
    return pDate.toISOString().slice(0, 7) === selectedMonth;
  });

  // Expected vs actual
  const expected = leases
    .filter(l => {
      const lStart = new Date(l.start_date);
      const lEnd = new Date(l.end_date || new Date(9999, 0, 1));
      const [year, month] = selectedMonth.split('-').map(Number);
      const checkDate = new Date(year, month - 1);
      return lStart <= checkDate && checkDate < lEnd;
    })
    .reduce((sum, l) => sum + l.monthly_rent, 0);

  const paid = monthPayments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
  const pending = monthPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overdue = monthPayments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);

  // Tenant-level breakdown
  const tenantCollections = leases.map(lease => {
    const unit = units.find(u => u.id === lease.unit_id);
    const payments_for_lease = monthPayments.filter(p => p.lease_contract_id === lease.id);
    const paid_amount = payments_for_lease.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
    const status = paid_amount >= lease.monthly_rent ? 'PAID' : paid_amount > 0 ? 'PARTIAL' : 'UNPAID';

    return {
      lease_id: lease.id,
      tenant_name: lease.tenant_name,
      unit: unit?.unit_number || 'N/A',
      expected: lease.monthly_rent,
      paid: paid_amount,
      status,
      email: lease.tenant_email,
      phone: lease.tenant_phone
    };
  });

  const handleSendReminder = async (email, tenantName) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: 'Mietpayment-Erinnerung',
        body: `Hallo ${tenantName},\n\ndiese Erinnerung betrifft die Mietzahlung für ${selectedMonth}.\n\nBitte überweisen Sie den ausstehenden Betrag.\n\nMit freundlichen Grüßen`
      });
      toast.success(`Erinnerung an ${tenantName} versendet`);
    } catch (error) {
      toast.error('Fehler beim Versand: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'PAID') return 'bg-green-50 border-green-200 text-green-900';
    if (status === 'PARTIAL') return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    return 'bg-red-50 border-red-200 text-red-900';
  };

  const getStatusIcon = (status) => {
    if (status === 'PAID') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'PARTIAL') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Mieteinzug</h1>
          <p className="text-slate-600 mt-2">Überwachen Sie Mieteinnahmen und Zahlungen</p>
        </div>

        {/* Month Selector & Summary */}
        <div className="flex gap-4 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-slate-600">Erwartet</p>
              <p className="text-2xl font-bold">€{expected.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-xs text-green-700">Eingezahlt</p>
              <p className="text-2xl font-bold text-green-900">€{paid.toFixed(0)}</p>
              <p className="text-xs text-green-600 mt-1">{((paid / expected) * 100).toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs text-yellow-700">Ausstehend</p>
              <p className="text-2xl font-bold text-yellow-900">€{pending.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-xs text-red-700">Überfällig</p>
              <p className="text-2xl font-bold text-red-900">€{overdue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Collection Details */}
        <Card>
          <CardHeader>
            <CardTitle>Mieter-Zahlungsstatus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenantCollections.map(tenant => (
                <div
                  key={tenant.lease_id}
                  className={`p-4 border rounded-lg flex items-center justify-between ${getStatusColor(tenant.status)}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(tenant.status)}
                    <div>
                      <p className="font-medium">{tenant.tenant_name}</p>
                      <p className="text-xs opacity-75">Einheit {tenant.unit}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">€{tenant.paid.toFixed(2)}</p>
                      <p className="text-xs opacity-75">von €{tenant.expected.toFixed(2)}</p>
                    </div>

                    {tenant.status !== 'PAID' && (
                      <Button
                        size="sm"
                        onClick={() => handleSendReminder(tenant.email, tenant.tenant_name)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Erinnerung
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}