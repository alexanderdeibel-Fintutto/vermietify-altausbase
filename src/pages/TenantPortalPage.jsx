import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, User, MessageSquare, AlertCircle } from 'lucide-react';
import TenantInvoices from '@/components/tenant-portal/TenantInvoices';
import TenantPaymentStatus from '@/components/tenant-portal/TenantPaymentStatus';
import TenantOperatingCosts from '@/components/tenant-portal/TenantOperatingCosts';
import TenantProfile from '@/components/tenant-portal/TenantProfile';
import TenantInquiry from '@/components/tenant-portal/TenantInquiry';

export default function TenantPortalPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await base44.auth.me();
      return result;
    }
  });

  // Hole Mieterdaten basierend auf User Email
  const { data: tenant } = useQuery({
    queryKey: ['tenantData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const tenants = await base44.entities.Tenant.filter({});
      return tenants.find(t => t.email === user.email);
    },
    enabled: !!user?.email
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Lädt...</div>;
  }

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">Mieterdaten nicht gefunden. Bitte kontaktieren Sie die Verwaltung.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mieterportal</h1>
          <p className="text-slate-600">
            Willkommen, {tenant?.first_name} {tenant?.last_name}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Rechnungen</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Zahlungen</span>
            </TabsTrigger>
            <TabsTrigger value="operating-costs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">BKA</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Stammdaten</span>
            </TabsTrigger>
            <TabsTrigger value="inquiry" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Anfrage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <TenantInvoices tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="payment">
            <TenantPaymentStatus tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="operating-costs">
            <TenantOperatingCosts tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="profile">
            <TenantProfile tenant={tenant} />
          </TabsContent>

          <TabsContent value="inquiry">
            <TenantInquiry tenantId={tenant.id} tenantEmail={tenant.email} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}