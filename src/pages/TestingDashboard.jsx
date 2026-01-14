import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { TestTube, Activity, AlertTriangle } from 'lucide-react';
import AutomatedTestRunner from '@/components/testing/AutomatedTestRunner';
import PerformanceMonitor from '@/components/monitoring/PerformanceMonitor';
import ErrorTracker from '@/components/analytics/ErrorTracker';

export default function TestingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-slate-900">Testing & Monitoring</h1>
        <p className="text-sm text-slate-600 mt-1">Systemstabilität und Performance-Überwachung</p>
      </div>

      <Tabs defaultValue="tests">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="tests" className="gap-2">
            <TestTube className="w-4 h-4" />
            Automatische Tests
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Fehler-Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-6">
          <AutomatedTestRunner />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}