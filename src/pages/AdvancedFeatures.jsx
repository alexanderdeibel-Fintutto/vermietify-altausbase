import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AnnualReportGenerator from '@/components/reports/AnnualReportGenerator';
import DATEVExporter from '@/components/reports/DATEVExporter';
import TaxOptimizationSuggestions from '@/components/analytics/TaxOptimizationSuggestions';
import BenchmarkComparison from '@/components/analytics/BenchmarkComparison';
import TrendAnalysisDashboard from '@/components/analytics/TrendAnalysisDashboard';
import WhatIfScenarios from '@/components/analytics/WhatIfScenarios';
import DeadlineReminders from '@/components/automation/DeadlineReminders';
import ScheduledTaskManager from '@/components/automation/ScheduledTaskManager';
import AutoCategorizationSettings from '@/components/automation/AutoCategorizationSettings';
import TaxAdvisorAccess from '@/components/collaboration/TaxAdvisorAccess';
import ApprovalWorkflow from '@/components/collaboration/ApprovalWorkflow';
import AuditLog from '@/components/security/AuditLog';
import GDPRDataExport from '@/components/security/GDPRDataExport';
import TwoFactorAuth from '@/components/security/TwoFactorAuth';
import OfflineMode from '@/components/mobile/OfflineMode';
import VoiceNoteCapture from '@/components/mobile/VoiceNoteCapture';
import GPSMileageTracker from '@/components/mobile/GPSMileageTracker';

export default function AdvancedFeatures() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Erweiterte Funktionen</h1>

      <Tabs defaultValue="reports">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="reports">Berichte</TabsTrigger>
          <TabsTrigger value="analytics">Analysen</TabsTrigger>
          <TabsTrigger value="automation">Automatisierung</TabsTrigger>
          <TabsTrigger value="collaboration">Kollaboration</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnualReportGenerator />
            <DATEVExporter />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <TaxOptimizationSuggestions />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BenchmarkComparison />
            <WhatIfScenarios />
          </div>
          <TrendAnalysisDashboard />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeadlineReminders />
            <ScheduledTaskManager />
          </div>
          <AutoCategorizationSettings />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaxAdvisorAccess />
            <ApprovalWorkflow />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TwoFactorAuth />
            <GDPRDataExport />
          </div>
          <AuditLog />
        </TabsContent>

        <TabsContent value="mobile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OfflineMode />
            <VoiceNoteCapture />
            <GPSMileageTracker />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}