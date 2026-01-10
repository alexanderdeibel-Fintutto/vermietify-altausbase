import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, TrendingUp } from 'lucide-react';
import OccupancyRateKPI from '@/components/property-manager/OccupancyRateKPI';
import AverageTenancyDurationKPI from '@/components/property-manager/AverageTenancyDurationKPI';
import PaymentPunctualityKPI from '@/components/property-manager/PaymentPunctualityKPI';
import MaintenanceCostKPI from '@/components/property-manager/MaintenanceCostKPI';
import CustomReportBuilder from '@/components/property-manager/CustomReportBuilder';

export default function PropertyManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Property Manager Dashboard</h1>
          <p className="text-slate-600">Zentrale KPIs und Reports für Ihre Immobilien</p>
        </div>
      </div>

      <Tabs defaultValue="kpis">
        <TabsList>
          <TabsTrigger value="kpis">KPIs & Kennzahlen</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OccupancyRateKPI />
            <AverageTenancyDurationKPI />
            <PaymentPunctualityKPI />
            <MaintenanceCostKPI />
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}