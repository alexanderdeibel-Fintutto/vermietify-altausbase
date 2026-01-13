import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AnalyticsHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-slate-600 text-sm mt-1">KPIs, Trends und Performance-Metriken</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}