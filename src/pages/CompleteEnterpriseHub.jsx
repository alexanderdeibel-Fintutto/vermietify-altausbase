import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import UniversalImporter from '@/components/import/UniversalImporter';
import MultiFormatExporter from '@/components/export/MultiFormatExporter';
import APIKeyManager from '@/components/api/APIKeyManager';
import WebhookManager from '@/components/api/WebhookManager';
import PushNotificationSettings from '@/components/notifications/PushNotificationSettings';
import EmailDigestSettings from '@/components/notifications/EmailDigestSettings';
import OfflineSyncManager from '@/components/mobile/OfflineSyncManager';
import GPSLocationTracker from '@/components/mobile/GPSLocationTracker';
import GoogleCalendarSync from '@/components/integrations/GoogleCalendarSync';
import SlackNotifications from '@/components/integrations/SlackNotifications';
import FullTextSearch from '@/components/search/FullTextSearch';
import SavedSearches from '@/components/search/SavedSearches';
import MultiMandantManager from '@/components/team/MultiMandantManager';
import TemplateLibrary from '@/components/templates/TemplateLibrary';
import BulkOperationsPanel from '@/components/bulk/BulkOperationsPanel';
import BackupRestore from '@/components/backup/BackupRestore';
import AIAssistant from '@/components/support/AIAssistant';
import VideoTutorials from '@/components/support/VideoTutorials';
import ContextualHelp from '@/components/support/ContextualHelp';
import DashboardBuilder from '@/components/dashboard/DashboardBuilder';
import FavoritesManager from '@/components/dashboard/FavoritesManager';

export default function CompleteEnterpriseHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Complete Enterprise Hub</h1>
      <p className="text-slate-600">Alle Enterprise-Features an einem Ort</p>

      <Tabs defaultValue="import">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="import">Import/Export</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="productivity">Produktivität</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UniversalImporter />
            <MultiFormatExporter />
            <APIKeyManager />
            <WebhookManager />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PushNotificationSettings />
            <EmailDigestSettings />
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OfflineSyncManager />
            <GPSLocationTracker />
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoogleCalendarSync />
            <SlackNotifications />
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FullTextSearch />
            <SavedSearches />
            <MultiMandantManager />
            <TemplateLibrary />
            <BulkOperationsPanel />
            <BackupRestore />
            <DashboardBuilder />
            <FavoritesManager />
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIAssistant />
            <VideoTutorials />
          </div>
          <ContextualHelp page="Buildings" />
        </TabsContent>
      </Tabs>
    </div>
  );
}