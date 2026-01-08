import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Send, FileText, CreditCard, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantPortal() {
  const [tenantId, setTenantId] = useState(null);

  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return user;
    }
  });

  const { data: leaseContracts = [] } = useQuery({
    queryKey: ['lease-contracts', tenantId],
    queryFn: () => base44.entities.LeaseContract.list(),
    enabled: !!tenantId
  });

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list()
  });

  const pendingPayments = financialItems.filter(
    item => item.status === 'pending' || item.status === 'overdue'
  );

  const handlePayment = async (itemId) => {
    // Redirect to payment page
    window.location.href = `/payment?item=${itemId}`;
  };

  const handleDownloadDocument = async (docId) => {
    try {
      const response = await base44.functions.invoke('downloadDocument', { document_id: docId });
      toast.success('Download gestartet');
    } catch (error) {
      toast.error('Download fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🏠 Mieter-Portal</h1>
        <p className="text-slate-600 mt-1">Verwalten Sie Ihre Miete, Dokumente und Zahlungen</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Ausstehende Zahlungen</p>
            <p className="text-2xl font-bold text-red-600">€{pendingPayments.reduce((sum, p) => sum + (p.expected_amount || 0), 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Aktive Mietverträge</p>
            <p className="text-2xl font-bold">{leaseContracts.filter(c => c.status === 'active').length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Verfügbare Dokumente</p>
            <p className="text-2xl font-bold">{documents.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">Zahlungen</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">Alle Zahlungen sind aktuell</p>
              </CardContent>
            </Card>
          ) : (
            pendingPayments.map(payment => (
              <Card key={payment.id} className={payment.status === 'overdue' ? 'border-red-300' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{payment.description}</CardTitle>
                      <p className="text-xs text-slate-600 mt-1">
                        Fällig: {new Date(payment.due_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Badge variant={payment.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {payment.status === 'overdue' ? '⚠️ Überfällig' : '📅 Ausstehend'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-2xl font-bold">€{payment.expected_amount.toFixed(2)}</p>
                  <Button onClick={() => handlePayment(payment.id)} className="bg-blue-600 hover:bg-blue-700">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Bezahlen
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">Noch keine Dokumente verfügbar</p>
              </CardContent>
            </Card>
          ) : (
            documents.map(doc => (
              <Card key={doc.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-slate-600">{new Date(doc.created_date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil & Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTenant ? (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-medium">{currentTenant.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">E-Mail</p>
                    <p className="font-medium">{currentTenant.email}</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Nachricht an Verwalter
                  </Button>
                </>
              ) : (
                <p className="text-slate-600">Bitte melden Sie sich an</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}