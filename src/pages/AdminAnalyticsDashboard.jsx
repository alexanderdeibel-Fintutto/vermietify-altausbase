import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import RoleBasedGuard from '@/components/admin/RoleBasedGuard';
import CommunicationAnalytics from '@/components/admin/analytics/CommunicationAnalytics';
import IssueAnalytics from '@/components/admin/analytics/IssueAnalytics';
import DocumentAnalytics from '@/components/admin/analytics/DocumentAnalytics';

export default function AdminAnalyticsDashboard() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Detaillierte Analysen</h1>
            <p className="text-slate-600">Umfassende Statistiken zu allen Verwaltungsbereichen</p>
          </div>
        </div>

        <Tabs defaultValue="communication" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communication">Kommunikation</TabsTrigger>
            <TabsTrigger value="issues">Störungsmeldungen</TabsTrigger>
            <TabsTrigger value="documents">Dokumente</TabsTrigger>
          </TabsList>

          <TabsContent value="communication" className="mt-6">
            <CommunicationAnalytics />
          </TabsContent>

          <TabsContent value="issues" className="mt-6">
            <IssueAnalytics />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </RoleBasedGuard>
  );
}