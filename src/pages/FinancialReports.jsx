import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, AlertCircle, Download } from 'lucide-react';
import IncomeExpenseOverview from '@/components/reports/IncomeExpenseOverview';
import PaymentAnalysis from '@/components/reports/PaymentAnalysis';
import FinancialExport from '@/components/reports/FinancialExport';
import BudgetManagement from '@/components/reports/BudgetManagement';
import FinancialForecast from '@/components/reports/FinancialForecast';

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState('current_year');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Finanzberichte</h1>
            <p className="text-slate-600">Umfassende Analyse Ihrer Einnahmen und Ausgaben</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <TrendingUp className="w-4 h-4 mr-2" />
            Einnahmen & Ausgaben
          </TabsTrigger>
          <TabsTrigger value="budget">
            Budgetverwaltung
          </TabsTrigger>
          <TabsTrigger value="forecast">
            Prognose
          </TabsTrigger>
          <TabsTrigger value="payments">
            <AlertCircle className="w-4 h-4 mr-2" />
            Zahlungsanalyse
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <IncomeExpenseOverview />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManagement />
        </TabsContent>

        <TabsContent value="forecast">
          <FinancialForecast />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentAnalysis />
        </TabsContent>

        <TabsContent value="export">
          <FinancialExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}