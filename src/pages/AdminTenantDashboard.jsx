import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, DollarSign, BarChart3, AlertCircle } from 'lucide-react';
import TenantBulkManagement from '@/components/admin/TenantBulkManagement';
import BuildingManagementDashboard from '@/components/admin/BuildingManagementDashboard';
import FinancialRecordsManager from '@/components/admin/FinancialRecordsManager';
import AdvancedReportingDashboard from '@/components/admin/AdvancedReportingDashboard';

export default function AdminTenantDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [tenants, buildings, contracts] = await Promise.all([
        base44.entities.Tenant.list(),
        base44.entities.Building.list(),
        base44.entities.LeaseContract.list()
      ]);

      const activeContracts = contracts.filter(c => c.status === 'active').length;
      const terminatedContracts = contracts.filter(c => c.status === 'terminated').length;

      return {
        totalTenants: tenants.length,
        totalBuildings: buildings.length,
        activeContracts,
        terminatedContracts,
        averageRent: contracts.length > 0
          ? (contracts.reduce((sum, c) => sum + (c.total_rent || 0), 0) / contracts.length).toFixed(2)
          : 0
      };
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Lädt...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Verwalte Mieter, Gebäude, Finanzen und Berichte</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4" /> Mieter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalTenants || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Gebäude
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.totalBuildings || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Aktive Verträge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.activeContracts || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Beendete Verträge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.terminatedContracts || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Ø Miete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.averageRent}€</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tenants" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Mieter</span>
            </TabsTrigger>
            <TabsTrigger value="buildings" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Gebäude</span>
            </TabsTrigger>
            <TabsTrigger value="financials" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Finanzen</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Berichte</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <TenantBulkManagement />
          </TabsContent>

          <TabsContent value="buildings">
            <BuildingManagementDashboard />
          </TabsContent>

          <TabsContent value="financials">
            <FinancialRecordsManager />
          </TabsContent>

          <TabsContent value="reports">
            <AdvancedReportingDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}