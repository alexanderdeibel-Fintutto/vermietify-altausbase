import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantFinancialOverview({ tenantEmail, tenantId }) {
  const [generatingStatement, setGeneratingStatement] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ['tenantPayments', tenantEmail],
    queryFn: () => base44.entities.Payment.filter({ tenant_email: tenantEmail }, '-payment_date', 50),
    enabled: !!tenantEmail
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['tenantContracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.filter({ tenant_id: tenantId }),
    enabled: !!tenantId
  });

  const activeContract = contracts.find(c => c.status === 'active');

  const handleGenerateStatement = async (year, month) => {
    setGeneratingStatement(true);
    try {
      const response = await base44.functions.invoke('generateRentStatement', {
        tenant_email: tenantEmail,
        year,
        month
      });
      
      // Download PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mietabrechnung_${year}_${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Abrechnung heruntergeladen');
    } catch (error) {
      toast.error('Fehler beim Generieren: ' + error.message);
    } finally {
      setGeneratingStatement(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayments = payments.filter(p => p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Gesamt bezahlt</p>
                <p className="text-2xl font-bold text-slate-900">{totalPaid.toLocaleString('de-DE')}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Ausstehend</p>
                <p className="text-2xl font-bold text-slate-900">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-slate-600">Monatliche Miete</p>
                <p className="text-2xl font-bold text-slate-900">
                  {(activeContract?.total_rent || 0).toLocaleString('de-DE')}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rent History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Zahlungshistorie
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                const today = new Date();
                handleGenerateStatement(today.getFullYear(), today.getMonth() + 1);
              }}
              disabled={generatingStatement}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Abrechnung
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-600">Keine Zahlungen vorhanden</p>
            ) : (
              payments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {payment.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-700" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {new Date(payment.payment_date).toLocaleDateString('de-DE', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                      <p className="text-xs text-slate-600">
                        {payment.payment_method || 'Überweisung'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{payment.amount?.toLocaleString('de-DE')}€</p>
                    <Badge className={`text-xs ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {payment.status === 'completed' ? 'Bezahlt' : 'Ausstehend'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Utility Breakdown */}
      {activeContract && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Nebenkostenübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Kaltmiete</p>
                <p className="text-xl font-bold text-slate-900">
                  {(activeContract.base_rent || 0).toLocaleString('de-DE')}€
                </p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Nebenkosten</p>
                <p className="text-xl font-bold text-slate-900">
                  {(activeContract.utilities || 0).toLocaleString('de-DE')}€
                </p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600 mb-1">Heizkosten</p>
                <p className="text-xl font-bold text-slate-900">
                  {(activeContract.heating || 0).toLocaleString('de-DE')}€
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-blue-900">Warmmiete gesamt</p>
                <p className="text-2xl font-bold text-blue-700">
                  {(activeContract.total_rent || 0).toLocaleString('de-DE')}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}