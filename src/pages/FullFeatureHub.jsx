import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import DashboardBuilder from '@/components/dashboard/DashboardBuilder';
import FavoritesManager from '@/components/dashboard/FavoritesManager';
import QuickActionsMenu from '@/components/dashboard/QuickActionsMenu';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import FinAPIBankingSync from '@/components/integrations/FinAPIBankingSync';
import CryptoExchangeSync from '@/components/integrations/CryptoExchangeSync';
import CalendarSync from '@/components/integrations/CalendarSync';
import ESignaturePanel from '@/components/integrations/ESignaturePanel';

import TeamDashboard from '@/components/team/TeamDashboard';
import MultiMandantManager from '@/components/team/MultiMandantManager';

import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import EmailDigestSettings from '@/components/notifications/EmailDigestSettings';

import TemplateLibrary from '@/components/templates/TemplateLibrary';
import BulkOperationsPanel from '@/components/bulk/BulkOperationsPanel';
import BackupRestore from '@/components/backup/BackupRestore';

import GoBDCompliance from '@/components/compliance/GoBDCompliance';
import LegalUpdatesMonitor from '@/components/compliance/LegalUpdatesMonitor';

export default function FullFeatureHub() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Feature Hub</h1>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardBuilder />
            <FavoritesManager />
          </div>
          <QuickActionsMenu />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinAPIBankingSync />
            <CryptoExchangeSync />
            <CalendarSync />
            <ESignaturePanel />
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamDashboard />
            <MultiMandantManager />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PushNotificationSettings />
            <EmailDigestSettings />
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TemplateLibrary />
            <BulkOperationsPanel />
            <BackupRestore />
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoBDCompliance />
            <LegalUpdatesMonitor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}