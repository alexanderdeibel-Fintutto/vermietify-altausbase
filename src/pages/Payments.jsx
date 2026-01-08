import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertTriangle, CheckCircle, Clock, Euro, Search, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import PaymentReminderDialog from '@/components/payments/PaymentReminderDialog';

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const queryClient = useQueryClient();

  const { data: financialItems = [] } = useQuery({
    queryKey: ['financial-items'],
    queryFn: () => base44.entities.FinancialItem.list()
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.FinancialItem.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-items'] });
      toast.success('Status aktualisiert');
    }
  });

  const receivables = financialItems.filter(f => f.type === 'receivable');
  
  const overduePayments = receivables.filter(f => {
    if (f.status === 'paid') return false;
    if (!f.due_date) return false;
    const daysDiff = differenceInDays(new Date(), parseISO(f.due_date));
    return daysDiff > 0;
  });

  const pendingPayments = receivables.filter(f => 
    f.status === 'pending' && 
    (!f.due_date || differenceInDays(parseISO(f.due_date), new Date()) >= 0)
  );

  const paidPayments = receivables.filter(f => f.status === 'paid');

  const totalOverdue = overduePayments.reduce((sum, p) => 
    sum + ((p.expected_amount || p.amount || 0) - (p.amount || 0)), 0
  );

  const totalPending = pendingPayments.reduce((sum, p) => 
    sum + (p.expected_amount || p.amount || 0), 0
  );

  const getTenantInfo = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return null;
    return tenants.find(t => t.id === contract.tenant_id);
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    return Math.max(0, differenceInDays(new Date(), parseISO(dueDate)));
  };

  const getUrgencyLevel = (daysOverdue) => {
    if (daysOverdue > 30) return { level: 'critical', color: 'red', text: 'Kritisch' };
    if (daysOverdue > 14) return { level: 'high', color: 'orange', text: 'Hoch' };
    if (daysOverdue > 7) return { level: 'medium', color: 'yellow', text: 'Mittel' };
    return { level: 'low', color: 'blue', text: 'Normal' };
  };

  const filteredPayments = (payments) => {
    return payments.filter(p => {
      const tenant = getTenantInfo(p.contract_id);
      const matchesSearch = tenant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const PaymentCard = ({ payment, showActions = true }) => {
    const tenant = getTenantInfo(payment.contract_id);
    const daysOverdue = getDaysOverdue(payment.due_date);
    const urgency = getUrgencyLevel(daysOverdue);
    const isOverdue = daysOverdue > 0 && payment.status !== 'paid';

    return (
      <Card className={`${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{tenant?.full_name || 'Unbekannt'}</span>
                {isOverdue && (
                  <Badge className={`bg-${urgency.color}-100 text-${urgency.color}-800`}>
                    {daysOverdue} Tage überfällig
                  </Badge>
                )}
              </div>
              <div className="text-sm text-slate-600 mb-2">{payment.description}</div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">
                    Fällig: {payment.due_date ? format(parseISO(payment.due_date), 'dd.MM.yyyy', { locale: de }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Euro className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">
                    {(payment.expected_amount || payment.amount || 0).toLocaleString('de-DE')} €
                  </span>
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2">
                {payment.status !== 'paid' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setReminderDialogOpen(true);
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateStatusMutation.mutate({ id: payment.id, status: 'paid' })}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {payment.status === 'paid' && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Bezahlt
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Zahlungen</h1>
          <p className="text-slate-600">Übersicht und Verwaltung aller Zahlungen</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <FileText className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Überfällig</div>
                <div className="text-2xl font-bold text-red-600">{overduePayments.length}</div>
                <div className="text-sm text-slate-500">{totalOverdue.toLocaleString('de-DE')} €</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Ausstehend</div>
                <div className="text-2xl font-bold text-orange-600">{pendingPayments.length}</div>
                <div className="text-sm text-slate-500">{totalPending.toLocaleString('de-DE')} €</div>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Bezahlt (Monat)</div>
                <div className="text-2xl font-bold text-green-600">{paidPayments.length}</div>
                <div className="text-sm text-slate-500">
                  {paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('de-DE')} €
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Mieter oder Beschreibung suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="overdue">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overdue">
            Überfällig ({overduePayments.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ausstehend ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Bezahlt ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="space-y-3">
          {filteredPayments(overduePayments).length > 0 ? (
            filteredPayments(overduePayments)
              .sort((a, b) => getDaysOverdue(b.due_date) - getDaysOverdue(a.due_date))
              .map(payment => <PaymentCard key={payment.id} payment={payment} />)
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Keine überfälligen Zahlungen
                </h3>
                <p className="text-slate-600">Alle Zahlungen sind pünktlich!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3">
          {filteredPayments(pendingPayments).length > 0 ? (
            filteredPayments(pendingPayments).map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Keine ausstehenden Zahlungen
                </h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-3">
          {filteredPayments(paidPayments).length > 0 ? (
            filteredPayments(paidPayments).map(payment => (
              <PaymentCard key={payment.id} payment={payment} showActions={false} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Keine Zahlungen
                </h3>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <PaymentReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        payment={selectedPayment}
        tenant={selectedPayment ? getTenantInfo(selectedPayment.contract_id) : null}
      />
    </div>
  );
}