import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Receipt, FileCheck } from 'lucide-react';

export default function TenantDocumentAccess({ tenantId }) {
  const { data: contract } = useQuery({
    queryKey: ['tenant-contract', tenantId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ tenant_id: tenantId, status: 'active' });
      return contracts[0];
    }
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['tenant-payments', tenantId],
    queryFn: () => base44.entities.Payment.filter({ tenant_id: tenantId }, '-created_date', 12)
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['tenant-settlements', tenantId],
    queryFn: () => base44.entities.UtilitySettlement.filter({ tenant_id: tenantId }, '-created_date', 3)
  });

  return (
    <Tabs defaultValue="contract" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="contract">Vertrag</TabsTrigger>
        <TabsTrigger value="payments">Zahlungen</TabsTrigger>
        <TabsTrigger value="bills">NK-Abrechnung</TabsTrigger>
      </TabsList>

      <TabsContent value="contract">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Mietvertrag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contract && (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 text-xs">Vertragsbeginn</p>
                    <p className="font-medium">{contract.start_date}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Vertragsende</p>
                    <p className="font-medium">{contract.end_date}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Kaltmiete</p>
                    <p className="font-medium">{contract.monthly_rent}€</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-xs">Nebenkosten</p>
                    <p className="font-medium">{contract.utility_advance}€</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Vertrag herunterladen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Zahlungshistorie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.map(payment => (
              <div key={payment.id} className="p-2 border rounded text-sm">
                <div className="flex items-center justify-between">
                  <span>{new Date(payment.payment_date).toLocaleDateString('de-DE')}</span>
                  <span className="font-bold">{payment.amount}€</span>
                </div>
                <p className="text-xs text-slate-600">{payment.payment_type}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bills">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nebenkostenabrechnungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settlements.map(settlement => (
              <div key={settlement.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {settlement.period_start} - {settlement.period_end}
                  </span>
                  <span className={`font-bold ${settlement.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {settlement.balance >= 0 ? '+' : ''}{settlement.balance}€
                  </span>
                </div>
                <div className="text-xs space-y-1">
                  <p>Vorauszahlungen: {settlement.advance_payments}€</p>
                  <p>Tatsächliche Kosten: {settlement.actual_costs}€</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Download className="w-3 h-3 mr-2" />
                  PDF herunterladen
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}