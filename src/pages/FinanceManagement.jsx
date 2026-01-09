import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DollarSign, FileText, Tag } from 'lucide-react';
import FinancialTransactionForm from '@/components/finance/FinancialTransactionForm';
import FinancialTransactionList from '@/components/finance/FinancialTransactionList';
import DashboardMetricsWidget from '@/components/reporting/DashboardMetricsWidget';

export default function FinanceManagementPage() {
  const queryClient = useQueryClient();

  // Fetch data
  const { data: transactions = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem.list('-transaction_date', 200),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-updated_date', 50),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.LeaseContract.list('-updated_date', 100),
  });

  const { data: costCenters = [] } = useQuery({
    queryKey: ['costCenters'],
    queryFn: () => base44.entities.CostCenter.list('-updated_date', 50),
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-updated_date', 100),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice?.list?.('-issue_date', 100).catch(() => []),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
    },
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const profit = income - expenses;
    const profitMargin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      profit,
      profitMargin,
      invoicesIssued: invoices.filter(i => i.status !== 'draft').length,
      invoicesPending: invoices.filter(i => i.status === 'overdue' || i.status === 'issued').length
    };
  }, [transactions, invoices]);

  // Entity maps for lookup
  const buildingMap = buildings.reduce((acc, b) => {
    acc[b.id] = b;
    return acc;
  }, {});

  const contractMap = contracts.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const equipmentMap = equipment.reduce((acc, e) => {
    acc[e.id] = e;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-slate-900">Finanzmanagement</h1>
        <p className="text-slate-600 font-light mt-2">Verwalten Sie Einnahmen, Ausgaben und Rechnungen</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <DashboardMetricsWidget
          title="Gesamteinnahmen"
          value={`${metrics.totalIncome.toFixed(2)} €`}
          icon={() => '💰'}
          color="green"
        />
        <DashboardMetricsWidget
          title="Gesamtausgaben"
          value={`${metrics.totalExpenses.toFixed(2)} €`}
          icon={() => '📉'}
          color="red"
        />
        <DashboardMetricsWidget
          title="Gewinn/Verlust"
          value={`${metrics.profit.toFixed(2)} €`}
          icon={() => '📊'}
          color={metrics.profit >= 0 ? 'green' : 'red'}
          trend={{ direction: metrics.profit >= 0 ? 'positive' : 'negative', text: `${metrics.profitMargin}% Gewinnmarge` }}
        />
        <DashboardMetricsWidget
          title="Ausstehende Rechnungen"
          value={metrics.invoicesPending}
          icon={() => '⏳'}
          color="orange"
          trend={{ direction: 'negative', text: `von ${metrics.invoicesIssued} Rechnungen` }}
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">
            <DollarSign className="w-4 h-4 mr-2" />
            Transaktionen
          </TabsTrigger>
          <TabsTrigger value="costcenters">
            <Tag className="w-4 h-4 mr-2" />
            Kostenstellen
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="w-4 h-4 mr-2" />
            Rechnungen
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          <FinancialTransactionForm
            buildings={buildings}
            contracts={contracts}
            costCenters={costCenters}
            equipment={equipment}
            onSubmit={(data) => createMutation.mutate(data)}
          />

          <FinancialTransactionList
            transactions={transactions}
            buildings={buildingMap}
            contracts={contractMap}
            equipment={equipmentMap}
          />
        </TabsContent>

        {/* Cost Centers Tab */}
        <TabsContent value="costcenters" className="mt-6">
          <CostCenterList costCenters={costCenters} transactions={transactions} />
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-6">
          <InvoiceList invoices={invoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CostCenterList({ costCenters = [], transactions = [] }) {
  if (costCenters.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Kostenstellen definiert</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {costCenters.map(cc => {
        const ccTransactions = transactions.filter(t => t.cost_center_id === cc.id);
        const spent = ccTransactions
          .filter(t => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const budgetUsage = cc.budget_amount ? ((spent / cc.budget_amount) * 100).toFixed(1) : 0;

        return (
          <Card key={cc.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-light text-slate-900">{cc.code} - {cc.name}</h3>
                <p className="text-sm font-light text-slate-600 mt-1">{cc.description}</p>
                <div className="flex gap-3 mt-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-light capitalize">
                    {cc.cost_center_type}
                  </span>
                  {cc.budget_amount && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-light">
                      Budget: {cc.budget_amount.toFixed(2)} € / {budgetUsage}% verbraucht
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-light">Ausgegeben</p>
                <p className="text-xl font-light text-slate-900">{spent.toFixed(2)} €</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function InvoiceList({ invoices = [] }) {
  if (invoices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 font-light">Keine Rechnungen vorhanden</p>
      </Card>
    );
  }

  const statusLabels = {
    draft: '📝 Entwurf',
    issued: '📤 Versendet',
    overdue: '⚠️ Überfällig',
    paid: '✅ Bezahlt',
    cancelled: '❌ Storniert'
  };

  return (
    <div className="space-y-2">
      {invoices.map(inv => (
        <Card key={inv.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-light text-slate-900">{inv.invoice_number}</h3>
              <p className="text-sm font-light text-slate-600 mt-1">{inv.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-light">
                  {statusLabels[inv.status] || inv.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-light text-slate-900">{(inv.total_amount || inv.amount).toFixed(2)} €</p>
              <p className="text-xs text-slate-500 font-light mt-1">
                Fällig: {new Date(inv.due_date).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}