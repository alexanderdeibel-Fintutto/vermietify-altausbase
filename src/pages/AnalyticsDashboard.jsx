import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import AIInsightsDashboard from '@/components/analytics/AIInsightsDashboard';
import SmartRecommendations from '@/components/analytics/SmartRecommendations';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import TrendAnalysis from '@/components/analytics/TrendAnalysis';
import CustomReportBuilder from '@/components/reporting/CustomReportBuilder';

export default function AnalyticsDashboard() {
  const [reportBuilderOpen, setReportBuilderOpen] = useState(false);
  const [entityType, setEntityType] = useState('Invoice');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & KI</h1>
          <p className="text-slate-600 text-sm mt-1">Insights, Empfehlungen & Custom Reports</p>
        </div>
        <Button
          onClick={() => setReportBuilderOpen(true)}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Report erstellen
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">🧠 Insights</TabsTrigger>
          <TabsTrigger value="recommendations">✨ Empfehlungen</TabsTrigger>
          <TabsTrigger value="metrics">📊 Metriken</TabsTrigger>
          <TabsTrigger value="trends">📈 Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <AIInsightsDashboard entityType={entityType} />
          <SmartRecommendations entityType={entityType} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <SmartRecommendations entityType={entityType} />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <PerformanceMetrics entityType={entityType} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendAnalysis entityType={entityType} />
        </TabsContent>
      </Tabs>

      {/* Report Builder Dialog */}
      <CustomReportBuilder open={reportBuilderOpen} onOpenChange={setReportBuilderOpen} />
    </div>
  );
}