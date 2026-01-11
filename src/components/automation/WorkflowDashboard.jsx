import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

export default function WorkflowDashboard({ companyId }) {
  const { data: reminders = [] } = useQuery({
    queryKey: ['payment-reminders', companyId],
    queryFn: () => base44.asServiceRole.entities.PaymentReminder.filter({ company_id: companyId, payment_received: false }, '-sent_date', 5)
  });

  const { data: renewals = [] } = useQuery({
    queryKey: ['contract-renewals', companyId],
    queryFn: () => base44.asServiceRole.entities.ContractRenewal.filter({ company_id: companyId }, '-current_end_date', 5)
  });

  const { data: indexAdjustments = [] } = useQuery({
    queryKey: ['index-adjustments', companyId],
    queryFn: () => base44.asServiceRole.entities.IndexRentAdjustment.filter({ company_id: companyId }, '-effective_date', 5)
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Zahlungserinnerungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reminders.map(r => (
            <div key={r.id} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <span>Mieter: {r.tenant_id.substring(0, 8)}</span>
                <Badge variant="destructive">Stufe {r.reminder_level}</Badge>
              </div>
              <p>{r.amount_due}€ - Fällig: {r.due_date}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Vertragsverlängerungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renewals.map(r => (
            <div key={r.id} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between mb-1">
                <span>Vertrag: {r.contract_id.substring(0, 8)}</span>
                <Badge>{r.status}</Badge>
              </div>
              <p>Bis: {r.proposed_end_date}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Indexmieten-Anpassungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {indexAdjustments.map(a => (
            <div key={a.id} className="p-2 border rounded text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.base_rent}€ → {a.adjusted_rent}€</p>
                  <p className="text-slate-600">Anpassung: +{a.adjustment_percentage}%</p>
                </div>
                <Badge variant={a.status === 'applied' ? 'outline' : 'default'}>
                  {a.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}